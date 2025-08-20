import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FacilitySidebar } from "@/components/facility/facility-sidebar"

export default function FacilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["facility"]}>
      <div className="flex h-screen bg-background">
        <FacilitySidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
