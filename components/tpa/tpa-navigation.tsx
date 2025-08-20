"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Upload, Users, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/tpa", icon: LayoutDashboard },
  { name: "Claims", href: "/tpa/claims", icon: FileText },
  { name: "Upload Data", href: "/tpa/upload", icon: Upload },
  { name: "Facilities", href: "/tpa/facilities", icon: Users },
  { name: "Reports", href: "/tpa/reports", icon: BarChart3 },
  { name: "Settings", href: "/tpa/settings", icon: Settings },
]

export function TPANavigation() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <nav
      className={cn("bg-[#104D7F] text-white transition-all duration-300 flex flex-col", collapsed ? "w-16" : "w-64")}
    >
      <div className="p-4 border-b border-blue-600">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-lg">TPA Portal</h2>
              <p className="text-white text-sm">Claims Management</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-blue-600"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-blue-100 hover:bg-blue-600 hover:text-white",
                    collapsed && "justify-center",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
