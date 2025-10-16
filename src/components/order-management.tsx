"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChefHat, Clock, AlertCircle } from "lucide-react"

const getRestaurantInfo = async () => {
  return {
    name: "Mock Restaurant",
    currency: "₹",
  }
}

interface RestaurantInfo {
  name: string
  currency: string
}

interface DishData {
  id: string
  name: string
  description: string
  price: number
  prep_time_minutes: number
  cook_time_minutes: number
  course: string
  dietary_restrictions: string
  spiciness_level: number
}

interface UserData {
  id: string
  name: string
  phone: string
  legacyPoints: number
}

interface OrderItemData {
  dish_id: string
  quantity: number
  dish_details?: DishData
}

interface OrderData {
  id: string
  user_id: string
  restaurant_id: string
  table_id: string
  status: "pending" | "preparing" | "completed" | "paid"
  total_amount: number
  special_notes: string
  created_at: string
  order_items: OrderItemData[]
  user_details?: UserData
  priorityScore?: number
}

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || getCookie("token")
  }
  return null
}

const getCookie = (name: string) => {
  if (typeof document !== "undefined") {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
  }
  return null
}

const fetchOrders = async () => {
  const token = getToken()
  if (!token) {
    return []
  }

  const response = await fetch("/api/orders", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch orders")
  }

  const data: OrderData[] = await response.json()
  return data.map((order) => {
    let totalTime = 0
    order.order_items.forEach((item) => {
      if (item.dish_details) {
        totalTime += (item.dish_details.prep_time_minutes + item.dish_details.cook_time_minutes) * item.quantity
      }
    })

    const priorityScore = totalTime / (order.user_details?.legacyPoints || 10)
    return { ...order, priorityScore: priorityScore }
  })
}

const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const token = getToken()
  if (!token) {
    return false
  }

  const response = await fetch(`/api/orders?id=${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: newStatus }),
  })

  return response.ok
}

const getCoursePriority = (course: string) => {
  switch (course) {
    case "Beverage":
      return 1
    case "Appetizer":
      return 2
    case "Main Course":
      return 3
    case "Side Dish":
      return 4
    case "Dessert":
      return 5
    default:
      return 99
  }
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null)

  const fetchAndPrioritizeOrders = async () => {
    setLoading(true)
    try {
      const allOrders = await fetchOrders()

      const pendingOrders = allOrders.filter((o) => o.status === "pending")
      const preparingOrders = allOrders.filter((o) => o.status === "preparing")
      const completedOrders = allOrders.filter((o) => o.status === "completed" || o.status === "paid")

      pendingOrders.sort((a, b) => {
        const aCourses = a.order_items.map((item) => getCoursePriority(item.dish_details?.course || ""))
        const bCourses = b.order_items.map((item) => getCoursePriority(item.dish_details?.course || ""))

        const aHighestPriority = Math.min(...aCourses)
        const bHighestPriority = Math.min(...bCourses)

        if (aHighestPriority !== bHighestPriority) {
          return aHighestPriority - bHighestPriority
        }

        return (a.priorityScore || 0) - (b.priorityScore || 0)
      })

      setOrders([...pendingOrders, ...preparingOrders, ...completedOrders])
      setError("")
    } catch {
      setError("Failed to fetch and prioritize orders.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoading(true)
    const success = await updateOrderStatus(orderId, newStatus)
    if (success) {
      await fetchAndPrioritizeOrders()
    } else {
      setError("Failed to update order status.")
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      const restaurant = await getRestaurantInfo()
      setRestaurantInfo(restaurant)
      fetchAndPrioritizeOrders()
    }
    initializeData()
  }, [])

  const getChefPrepSequence = () => {
    const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing")
    const allItems: { orderId: string; quantity: number; userDetails?: UserData; dishDetails?: DishData }[] = []

    activeOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        allItems.push({
          orderId: order.id,
          quantity: item.quantity,
          userDetails: order.user_details,
          dishDetails: item.dish_details,
        })
      })
    })

    allItems.sort((a, b) => {
      const aCoursePriority = getCoursePriority(a.dishDetails?.course || "")
      const bCoursePriority = getCoursePriority(b.dishDetails?.course || "")

      return aCoursePriority - bCoursePriority
    })

    return allItems
  }

  const chefPrepSequence = getChefPrepSequence()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-500" />
            Orders Management
          </h2>
          <p className="text-neutral-600 mt-2">Manage incoming and in-progress orders from your customers.</p>
        </div>
        <button
          onClick={fetchAndPrioritizeOrders}
          className="px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
        >
          Refresh Orders
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-neutral-600">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Orders to Display</h3>
          <p className="text-neutral-600">It&apos;s a quiet moment. Check back soon for new orders!</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
            {/* New and Pending Orders */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">New & Pending Orders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders
                  .filter((o) => o.status === "pending")
                  .map((order) => (
                    <div key={order.id} className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg text-neutral-900">Order #{String(order.id).slice(-6)}</span>
                        <span className="px-3 py-1 text-xs font-semibold text-white rounded-full bg-orange-500">
                          Priority: {Math.round(100 - (order.priorityScore || 0))}%
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        <span className="font-medium text-neutral-900">{order.user_details?.name}</span> •{" "}
                        <span className="text-xs">{order.special_notes || "No special notes"}</span>
                      </p>
                      <p className="text-xs text-neutral-500 mb-4">
                        Legacy Points: {order.user_details?.legacyPoints || 0}
                      </p>
                      <ul className="space-y-2 mb-4 pb-4 border-b border-orange-200">
                        {order.order_items.map((item, index) => (
                          <li key={index} className="flex justify-between items-center text-sm">
                            <span className="text-neutral-700">
                              {item.quantity} x {item.dish_details?.name}
                            </span>
                            <span className="text-xs text-neutral-500">{item.dish_details?.course}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl text-orange-600">
                          {restaurantInfo?.currency || "₹"}
                          {order.total_amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(order.id, "preparing")}
                          className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Start Preparing
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* In Progress Orders */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">In Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders
                  .filter((o) => o.status === "preparing")
                  .map((order) => (
                    <div key={order.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg text-neutral-900">Order #{String(order.id).slice(-6)}</span>
                        <span className="px-3 py-1 text-xs font-semibold text-white rounded-full bg-yellow-500">
                          In Progress
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-4">
                        <span className="font-medium text-neutral-900">{order.user_details?.name}</span>
                      </p>
                      <ul className="space-y-2 mb-4 pb-4 border-b border-yellow-200">
                        {order.order_items.map((item, index) => (
                          <li key={index} className="flex justify-between items-center text-sm">
                            <span className="text-neutral-700">
                              {item.quantity} x {item.dish_details?.name}
                            </span>
                            <span className="text-xs text-neutral-500">{item.dish_details?.course}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl text-yellow-600">
                          {restaurantInfo?.currency || "₹"}
                          {order.total_amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(order.id, "completed")}
                          className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Preparation Sequence Panel */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white border border-neutral-200 rounded-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Preparation Sequence
              </h3>
              {chefPrepSequence.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">No items in the queue.</div>
              ) : (
                <div className="space-y-3">
                  {chefPrepSequence.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">
                          {item.quantity} x {item.dishDetails?.name}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          Order #{String(item.orderId).slice(-6)} from {item.userDetails?.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-2">
                          {item.dishDetails?.course} • Prep: {item.dishDetails?.prep_time_minutes}m • Cook:{" "}
                          {item.dishDetails?.cook_time_minutes}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
