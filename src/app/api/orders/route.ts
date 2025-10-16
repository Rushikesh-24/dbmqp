import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

// This route handles fetching all pending and preparing orders for a restaurant.
export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.substring(7);
    let decoded: { id: string; email: string };

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const restaurantId = decoded.id;

    // 1. Fetch orders that are not yet completed or paid
    interface OrderRow {
      id: string;
      user_id: string;
      restaurant_id: string;
      table_id: string;
      status: string;
      total_amount: number;
      special_notes: string | null;
      created_at: string;
    }

    const { rows: orderRows } = await turso.execute({
      sql: "SELECT id, user_id, restaurant_id, table_id, status, total_amount, special_notes, created_at FROM orders WHERE restaurant_id = ? AND status IN ('pending', 'preparing')",
      args: [restaurantId],
    });

    if (orderRows.length === 0) {
      return Response.json([]);
    }

    const orderIds = (orderRows as unknown as OrderRow[]).map((row) => row.id);
    const userIds = [...new Set((orderRows as unknown as OrderRow[]).map((row) => row.user_id))];

    // 2. Fetch all related order items and dish details
    const orderItemsQuery = `
      SELECT oi.order_id, oi.quantity, d.id AS dish_id, d.name, d.price, d.prep_time_minutes, d.cook_time_minutes, d.course, d.dietary_restrictions, d.spiciness_level, d.description
      FROM order_items oi
      INNER JOIN dishes d ON oi.dish_id = d.id
      WHERE oi.order_id IN (${orderIds.map(() => '?').join(', ')})
    `;
    const { rows: orderItemRows } = await turso.execute({
      sql: orderItemsQuery,
      args: orderIds,
    });

    // 3. Fetch user details
    const usersQuery = `
      SELECT id, name, legacyPoints
      FROM users
      WHERE id IN (${userIds.map(() => '?').join(', ')})
    `;
    const { rows: userRows } = await turso.execute({
      sql: usersQuery,
      args: userIds,
    });

    // Create a map for quick lookup
    interface OrderItemRow {
      order_id: string;
      quantity: number;
      dish_id: string;
      name: string;
      price: number;
      prep_time_minutes: number;
      cook_time_minutes: number;
      course: string;
      dietary_restrictions: string;
      spiciness_level: number;
      description: string;
    }
    interface UserRow {
      id: string;
      name: string;
      legacyPoints: number;
    }
    const orderItemsMap = new Map();
    (orderItemRows as unknown as OrderItemRow[]).forEach((item) => {
      const { order_id, ...itemDetails } = item;
      if (!orderItemsMap.has(order_id)) {
        orderItemsMap.set(order_id, []);
      }
      orderItemsMap.get(order_id).push({
        dish_id: itemDetails.dish_id,
        quantity: itemDetails.quantity,
        dish_details: itemDetails,
      });
    });

    const usersMap = new Map((userRows as unknown as UserRow[]).map((user) => [user.id, user]));

    // 4. Assemble the final data structure
    const ordersWithDetails = (orderRows as unknown as OrderRow[]).map((order: OrderRow) => {
      const orderId = order.id;
      const orderItems = orderItemsMap.get(orderId) || [];
      const userDetails = usersMap.get(order.user_id);
      
      return {
        ...order,
        order_items: orderItems,
        user_details: userDetails,
      };
    });

    return Response.json(ordersWithDetails);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    try {
        const authorization = request.headers.get("authorization");
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const token = authorization.substring(7);
        let decoded: { id: string; email: string };

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
                id: string;
                email: string;
            };
        } catch {
            return Response.json({ message: "Invalid token" }, { status: 401 });
        }

        const restaurantId = decoded.id;

        // Extract orderId from the URL query parameters
        const url = new URL(request.url);
        const orderId = url.searchParams.get("id");

        if (!orderId) {
            return Response.json({ message: "Order ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const newStatus = body.status;

        // Validate the new status
        const validStatuses = ["pending", "preparing", "completed", "paid"];
        if (!newStatus || !validStatuses.includes(newStatus)) {
            return Response.json({ message: "Invalid status provided" }, { status: 400 });
        }

        // Check if the order exists and belongs to the restaurant
        const { rows: existingOrderRows } = await turso.execute({
            sql: "SELECT id FROM orders WHERE id = ? AND restaurant_id = ?",
            args: [orderId, restaurantId],
        });

        if (!existingOrderRows || existingOrderRows.length === 0) {
            return Response.json(
                { message: "Order not found or not authorized" },
                { status: 404 }
            );
        }

        await turso.execute({
            sql: "UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?",
            args: [newStatus, orderId, restaurantId],
        });

        return Response.json({ message: "Order updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}
