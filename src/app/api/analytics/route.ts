import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

interface OrderData {
  id: string;
  user_id: string;
  restaurant_id: string;
  table_id: string;
  status: string;
  total_amount: number;
  special_notes: string;
  created_at: string;
  table_number?: string;
  user_name?: string;
}

interface OrderItemData {
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Default to last 30 days if no dates provided
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = new Date();

    const filterStartDate =
      startDate || defaultStartDate.toISOString().split("T")[0];
    const filterEndDate = endDate || defaultEndDate.toISOString().split("T")[0];

    // Fetch orders with table and user information
    const { rows: orders } = await turso.execute(
      `
            SELECT 
                o.*,
                t.table_number,
                u.name as user_name
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.restaurant_id = ?
            AND DATE(o.created_at) BETWEEN ? AND ?
            ORDER BY o.created_at DESC
        `,
      [decoded.id, filterStartDate, filterEndDate]
    );

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (orders as unknown as OrderData[]).map(async (order: OrderData) => {
        const { rows: items } = await turso.execute(
          `
                    SELECT 
                        oi.*,
                        d.name as dish_name,
                        d.price
                    FROM order_items oi
                    JOIN dishes d ON oi.dish_id = d.id
                    WHERE oi.order_id = ?
                `,
          [order.id]
        );

        return {
          ...order,
          items: items as unknown as OrderItemData[],
        };
      })
    );

    // Calculate analytics
    const analytics = calculateAnalytics(ordersWithItems);

    return Response.json({
      orders: ordersWithItems,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

function calculateAnalytics(
  orders: (OrderData & { items: OrderItemData[] })[]
) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Popular dishes
  const dishStats: {
    [key: string]: { name: string; quantity: number; revenue: number };
  } = {};

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!dishStats[item.dish_id]) {
        dishStats[item.dish_id] = {
          name: item.dish_name,
          quantity: 0,
          revenue: 0,
        };
      }
      dishStats[item.dish_id].quantity += item.quantity;
      dishStats[item.dish_id].revenue += item.quantity * item.price;
    });
  });

  const popularDishes = Object.values(dishStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 20);

  // Revenue by day
  const revenueByDay: { [key: string]: { revenue: number; orders: number } } =
    {};

  orders.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split("T")[0];
    if (!revenueByDay[date]) {
      revenueByDay[date] = { revenue: 0, orders: 0 };
    }
    revenueByDay[date].revenue += order.total_amount;
    revenueByDay[date].orders += 1;
  });

  const revenueByDayArray = Object.entries(revenueByDay)
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Orders by status
  const ordersByStatus: { [key: string]: number } = {};
  orders.forEach((order) => {
    ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
  });

  const ordersByStatusArray = Object.entries(ordersByStatus).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  // Orders by table
  const ordersByTable: { [key: string]: { orders: number; revenue: number } } =
    {};

  orders.forEach((order) => {
    const tableKey = order.table_number || `Table ${order.table_id}`;
    if (!ordersByTable[tableKey]) {
      ordersByTable[tableKey] = { orders: 0, revenue: 0 };
    }
    ordersByTable[tableKey].orders += 1;
    ordersByTable[tableKey].revenue += order.total_amount;
  });

  const ordersByTableArray = Object.entries(ordersByTable)
    .map(([table_number, data]) => ({
      table_number,
      orders: data.orders,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.orders - a.orders);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    popularDishes,
    revenueByDay: revenueByDayArray,
    ordersByStatus: ordersByStatusArray,
    ordersByTable: ordersByTableArray,
  };
}
