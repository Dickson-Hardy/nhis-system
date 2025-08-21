"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { LayoutDashboard, FileText, UserPlus, Send, BarChart3, Settings, LogOut, Shield, Package } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/facility", icon: LayoutDashboard },
  { name: "Patient Records", href: "/facility/patients", icon: UserPlus },
  { name: "Discharge Forms", href: "/facility/discharge", icon: FileText },
  { name: "Batch Management", href: "/facility/batches", icon: Package },
  { name: "Submit Claims", href: "/facility/submit", icon: Send },
  { name: "Analytics", href: "/facility/analytics", icon: BarChart3 },
  { name: "Settings", href: "/facility/settings", icon: Settings },
]

export function FacilitySidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-lg">
      {/* Header with NHIA Brand Colors */}
      <div className="flex h-20 items-center px-6 border-b border-sidebar-border bg-gradient-to-r from-[#088C17] to-[#003C06]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="h-6 w-6 text-[#088C17]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white drop-shadow-md">NHIA Facility Portal</h1>
            <p className="text-xs text-green-100 drop-shadow-sm">Healthcare Management</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-4 bg-sidebar-primary/10">
        <div className="mb-4 text-sm text-sidebar-foreground">
          <p className="font-medium">{user?.name}</p>
          <p className="text-sidebar-foreground/70">{user?.email}</p>
          <p className="text-xs text-sidebar-accent font-medium">Facility Administrator</p>
        </div>
        <Button variant="outline" className="w-full justify-start gap-3 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/10" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
