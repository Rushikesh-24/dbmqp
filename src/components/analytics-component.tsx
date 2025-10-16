"use client"

import { useState, useEffect, useCallback } from "react"
import { appCache, getRestaurantInfo, type RestaurantInfo } from "@/lib/utils"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import { TrendingUp } from "lucide-react"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

interface OrderData {
  id: string
  user_id: string
  restaurant_id: string
  table_id: string
  status: string
  total_amount: number
  special_notes: string
  created_at: string
  table_number?: string
  user_name?: string
  items?: OrderItemData[]
}

interface OrderItemData {
  dish_id: string
  dish_name: string
  quantity: number
  price: number
}

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  popularDishes: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  ordersByStatus: Array<{
    status: string
    count: number
  }>
  ordersByTable: Array<{
    table_number: string
    orders: number
    revenue: number
  }>
}

export default function AnalyticsComponent() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null)

  const getCookie = useCallback((name: string) => {
    if (typeof document !== "undefined") {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
    }
    return null
  }, [])

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || getCookie("token")
    }
    return null
  }, [getCookie])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/signin"
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)

      if (!restaurantInfo) {
        const restaurant = await getRestaurantInfo()
        setRestaurantInfo(restaurant)
      }

      const cacheKey = `analytics`
      const cachedAnalytics = appCache.get<{
        analytics: unknown
        orders: unknown
      }>(cacheKey)

      if (cachedAnalytics) {
        setAnalytics(cachedAnalytics.analytics as AnalyticsData)
        setOrders(cachedAnalytics.orders as OrderData[])
        setLoading(false)
      }

      const token = getToken()
      if (!token) {
        handleLogout()
        return
      }

      const response = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
        setOrders(data.orders)
        appCache.set(cacheKey, data, 1 * 60 * 1000)
        setError("")
      } else if (response.status === 401) {
        handleLogout()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch analytics")
      }
    } catch {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }, [getToken, handleLogout, restaurantInfo])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const revenueChartData = {
    labels:
      analytics?.revenueByDay.map((item) => {
        const date = new Date(item.date)
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      }) || [],
    datasets: [
      {
        label: "Daily Revenue",
        data: analytics?.revenueByDay.map((item) => item.revenue) || [],
        borderColor: "#f4a261",
        backgroundColor: "rgba(244, 162, 97, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#f4a261",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  }

  const popularDishesChartData = {
    labels: analytics?.popularDishes.slice(0, 10).map((item) => item.name) || [],
    datasets: [
      {
        label: "Orders",
        data: analytics?.popularDishes.slice(0, 10).map((item) => item.quantity) || [],
        backgroundColor: "#f4a261",
        borderColor: "#e8934f",
        borderWidth: 1,
      },
    ],
  }

  const orderStatusChartData = {
    labels: analytics?.ordersByStatus.map((item) => item.status) || [],
    datasets: [
      {
        data: analytics?.ordersByStatus.map((item) => item.count) || [],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#6b7280"],
        borderColor: ["#059669", "#d97706", "#dc2626", "#4b5563"],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 12, weight: 500 },
          color: "#57534e",
          padding: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Analytics Data</h3>
        <p className="text-neutral-600">Start taking orders to see analytics insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-orange-500" />
          Restaurant Analytics
        </h2>
        <p className="text-neutral-600 mt-2">Track your restaurant&apos;s performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-600 mb-2">Total Revenue</h3>
          <p className="text-4xl font-bold text-orange-600">
            {restaurantInfo?.currency || "₹"}
            {analytics.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-600 mb-2">Total Orders</h3>
          <p className="text-4xl font-bold text-blue-600">{analytics.totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-600 mb-2">Average Order Value</h3>
          <p className="text-4xl font-bold text-green-600">
            {restaurantInfo?.currency || "₹"}
            {analytics.averageOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          <div className="h-80">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Order Status Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut data={orderStatusChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Popular Dishes Chart */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Popular Dishes (Top 10)</h3>
        <div className="h-80">
          <Bar data={popularDishesChartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-semibold text-neutral-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    #{String(order.id).slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    Table {order.table_number || order.table_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {restaurantInfo?.currency || "₹"}
                    {order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-8 text-neutral-500">No orders found for the selected date range.</div>
        )}
      </div>
    </div>
  )
}
