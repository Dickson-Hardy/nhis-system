import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["nhis_admin"]}>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="min-h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
