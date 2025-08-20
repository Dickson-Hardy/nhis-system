"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import Image from "next/image"
import { LayoutDashboard, FileText, UserPlus, Send, BarChart3, Settings, LogOut } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/facility", icon: LayoutDashboard },
  { name: "Patient Records", href: "/facility/patients", icon: UserPlus },
  { name: "Discharge Forms", href: "/facility/discharge", icon: FileText },
  { name: "Submit Claims", href: "/facility/submit", icon: Send },
  { name: "Analytics", href: "/facility/analytics", icon: BarChart3 },
  { name: "Settings", href: "/facility/settings", icon: Settings },
]

export function FacilitySidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Image 
            src="/NHIA-1-1.png" 
            alt="NHIA Logo" 
            width={32} 
            height={16}
            className="object-contain"
          />
          <h1 className="text-lg font-bold text-sidebar-foreground">NHIA Facility Portal</h1>
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

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-4 text-sm text-sidebar-foreground">
          <p className="font-medium">{user?.name}</p>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
