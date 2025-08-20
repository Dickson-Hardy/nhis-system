import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TPAHeader } from "@/components/tpa/tpa-header"
import { TPASidebar } from "@/components/tpa/tpa-sidebar"

export default function TPALayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["tpa"]}>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <TPASidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TPAHeader />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
