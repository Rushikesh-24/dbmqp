"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import RestaurantInfo from "@/components/restaurant-info"
import AnalyticsComponent from "@/components/analytics-component"
import TablesManagement from "@/components/tables-management"
import MenuManagement from "@/components/menu-management"
import QRCodesManagement from "@/components/qr-codes-management"
import DishManagement from "@/components/dish-management"
import OrderManagement from "./order-management"
import { LogOut } from "lucide-react"

export default function DashboardLayout() {
  const [activeSection, setActiveSection] = useState("restaurant-info")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuFilter, setMenuFilter] = useState<{
    menuId: string
    menuName: string
  } | null>(null)
  const router = useRouter()

  // Navigation event listener
  useEffect(() => {
    const handleNavigateToDishes = (event: CustomEvent) => {
      const { menuId, menuName } = event.detail
      if (menuId && menuName) {
        setMenuFilter({ menuId, menuName })
      } else {
        setMenuFilter(null)
      }
      setActiveSection("dishes")
    }

    window.addEventListener("navigate-to-dishes", handleNavigateToDishes as EventListener)

    return () => {
      window.removeEventListener("navigate-to-dishes", handleNavigateToDishes as EventListener)
    }
  }, [])

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || getCookie("token")
      if (!token) {
        router.push("/signin")
        return
      }

      // Decode JWT to check if it's valid
      try {
        const decoded = decodeJWT(token)
        if (!decoded || decoded.exp * 1000 < Date.now()) {
          // Token expired
          localStorage.removeItem("token")
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
          router.push("/signin")
          return
        }
        setIsAuthenticated(true)
      } catch {
        router.push("/signin")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const getCookie = (name: string) => {
    if (typeof document !== "undefined") {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
    }
    return null
  }

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push("/signin")
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "restaurant-info":
        return <RestaurantInfo />
      case "analytics":
        return <AnalyticsComponent />
      case "tables":
        return <TablesManagement />
      case "menu":
        return <MenuManagement />
      case "qr-codes":
        return <QRCodesManagement />
      case "dishes":
        return <DishManagement menuFilter={menuFilter} />
      case "orders":
        return <OrderManagement />
      default:
        return <RestaurantInfo />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset className="bg-neutral-50">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 bg-white border-b border-neutral-200 px-6 shadow-sm">
          <SidebarTrigger className="-ml-2 text-neutral-600 hover:text-neutral-900" />
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="min-h-[calc(100vh-120px)] rounded-xl bg-white border border-neutral-200 p-8 shadow-sm">
            {renderActiveSection()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
