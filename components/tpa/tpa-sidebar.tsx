"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { LayoutDashboard, FileText, Upload, Users, BarChart3, Settings, LogOut, Calculator, Package, Shield, CreditCard } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/tpa", icon: LayoutDashboard },
  { name: "Batch Management", href: "/tpa/batches", icon: Package },
  { name: "Claims Processing", href: "/tpa/claims", icon: Calculator },
  { name: "Claims Audit", href: "/tpa/audit", icon: Shield },
  { name: "Payment Management", href: "/tpa/payments", icon: CreditCard },
  { name: "Upload Claims", href: "/tpa/upload", icon: Upload },
  { name: "Analytics", href: "/tpa/analytics", icon: BarChart3 },
  { name: "Settings", href: "/tpa/settings", icon: Settings },
]

export function TPASidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-full w-72 lg:w-72 md:w-64 sm:w-16 flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex h-20 items-center px-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-blue-600 font-bold text-lg">₦</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white drop-shadow-md">NHIS TPA Portal</h1>
            <p className="text-xs text-blue-100 drop-shadow-sm">Claims Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-left font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                    isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/tpa/upload">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                <Upload className="h-3 w-3 mr-2" />
                Upload Claims
              </Button>
            </Link>
            <Link href="/tpa/batches">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                <Package className="h-3 w-3 mr-2" />
                Create Batch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm drop-shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'TPA User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@tpa.com'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-10" 
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
