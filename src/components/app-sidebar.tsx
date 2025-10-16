"use client"

import type * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UtensilsCrossed, QrCode, BarChart3, Settings, ShoppingCart, Table2 } from "lucide-react"
import Image from "next/image"
import logo from "../../public/shrut.png"
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: string
  onSectionChange: (section: string) => void
}

const navigationItems = [
  {
    id: "restaurant-info",
    title: "Restaurant Info",
    icon: Settings,
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
  },
  {
    id: "tables",
    title: "Tables",
    icon: Table2,
  },
  {
    id: "qr-codes",
    title: "QR Codes",
    icon: QrCode,
  },
  {
    id: "menu",
    title: "Menu Categories",
    icon: UtensilsCrossed,
  },
  {
    id: "dishes",
    title: "Dishes",
    icon: UtensilsCrossed,
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
  },
]

export function AppSidebar({ activeSection, onSectionChange, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props} className="border-r border-neutral-200">
      <SidebarContent className="bg-white">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <Image src={logo} alt="🐰Logo" className="size-14 aspect-square"/>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">nomnom</h1>
              <p className="text-xs text-neutral-500">Restaurant Manager</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-neutral-500 text-xs uppercase tracking-wider font-semibold px-3 py-3">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      isActive={isActive}
                      className={`w-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-orange-50 text-orange-600 font-semibold"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
