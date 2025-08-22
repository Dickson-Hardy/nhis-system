"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import Image from "next/image"
import { LayoutDashboard, FileText, UserPlus, Send, BarChart3, Settings, LogOut, Shield, Package } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/facility", icon: LayoutDashboard, description: "Overview & statistics" },
  { name: "Patient Records", href: "/facility/patients", icon: UserPlus, description: "Patient management" },
  { name: "Discharge Forms", href: "/facility/discharge", icon: FileText, description: "Create discharge forms" },
  { name: "Batch Management", href: "/facility/batches", icon: Package, description: "Manage claim batches" },
  { name: "Submit Claims", href: "/facility/submit", icon: Send, description: "Submit claims to TPA" },
  { name: "Analytics", href: "/facility/analytics", icon: BarChart3, description: "Data insights" },
  { name: "Settings", href: "/facility/settings", icon: Settings, description: "System configuration" },
]

export function FacilitySidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-full w-72 flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-2xl">
      {/* Enhanced Header with Modern Design */}
      <div className="relative overflow-visible bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
              <Image 
                src="/NHIA-1-1.png" 
                alt="NHIS Logo" 
                width={40} 
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-lg font-poppins">NHIS Facility Portal</h1>
              <p className="text-sm text-emerald-100 drop-shadow-md font-medium font-poppins">Healthcare Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 py-6">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 font-poppins">Navigation</h3>
        </div>
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-4 h-14 px-4 rounded-xl transition-all duration-200 group font-poppins",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm",
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold font-poppins">{item.name}</div>
                    <div className={cn(
                      "text-xs transition-colors font-poppins",
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-slate-200/60 p-6 bg-gradient-to-r from-slate-50/50 to-slate-100/50">
        <div className="mb-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm font-poppins">
                {user?.name?.charAt(0)?.toUpperCase() || 'F'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 font-poppins">{user?.name}</p>
              <p className="text-sm text-slate-600 font-poppins">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-semibold text-emerald-700 font-poppins">Facility Administrator</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-center gap-3 h-12 bg-white/80 backdrop-blur-sm border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-xl transition-all duration-200 font-poppins font-semibold" 
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
