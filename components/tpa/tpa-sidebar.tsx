"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Shield,
  FileText,
  BarChart3,
  Users,
  Building,
  Settings,
  Upload,
  Package,
  LogOut,
  AlertTriangle
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/tpa", icon: Shield },
  { name: "Claims", href: "/tpa/claims", icon: FileText },
  { name: "Batches", href: "/tpa/batches", icon: Package },
  { name: "Facilities", href: "/tpa/facilities", icon: Building },
  { name: "Payments", href: "/tpa/payments", icon: BarChart3 },
  { name: "Reports", href: "/tpa/reports", icon: BarChart3 },
  { name: "Error Logs", href: "/tpa/error-logs", icon: AlertTriangle },
  { name: "Settings", href: "/tpa/settings", icon: Settings },
]

export function TPASidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-full w-72 lg:w-72 md:w-64 sm:w-16 flex-col bg-sidebar border-r border-sidebar-border shadow-lg transition-all duration-300">
      {/* Enhanced Professional Header with NHIA Brand Colors */}
      <div className="flex h-24 items-center px-8 border-b border-sidebar-border bg-gradient-to-r from-[#088C17] to-[#003C06]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
            <Shield className="h-7 w-7 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-md">NHIA TPA Portal</h1>
            <p className="text-sm text-green-100 drop-shadow-sm">Claims Management System</p>
          </div>
        </div>
      </div>

      {/* Enhanced Professional Navigation */}
      <div className="flex-1 px-6 py-8">
        <nav className="space-y-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-14 text-left font-medium transition-all duration-200 rounded-xl",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-accent shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                    isActive ? "bg-sidebar-accent/20 text-sidebar-accent-foreground" : "bg-sidebar-primary/20 text-sidebar-primary-foreground"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-base">{item.name}</span>
                  {isActive && (
                    <div className="w-3 h-3 bg-sidebar-accent rounded-full" />
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Enhanced Quick Actions Section */}
        <div className="mt-12 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-200 shadow-lg">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/tpa/upload">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm h-10 border-green-200 text-green-700 hover:bg-green-50 rounded-lg">
                <Upload className="h-4 w-4 mr-3" />
                Upload Claims
              </Button>
            </Link>
            <Link href="/tpa/batches">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm h-10 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg">
                <Package className="h-4 w-4 mr-3" />
                Create Batch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Professional User Profile Section */}
      <div className="border-t border-sidebar-border p-6 bg-sidebar-primary/10">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#088C17] to-[#003C06] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-lg drop-shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || 'user@example.com'}</p>
            <p className="text-xs text-sidebar-accent font-medium mt-1">TPA Administrator</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/10 rounded-xl h-11" 
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
