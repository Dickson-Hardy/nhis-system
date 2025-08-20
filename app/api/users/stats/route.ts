import { type NextRequest, NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { eq, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/users/stats - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get user counts by role
    const totalUsers = await db.select({ count: count() }).from(users)
    const activeUsers = await db.select({ count: count() }).from(users).where(eq(users.isActive, true))
    const inactiveUsers = await db.select({ count: count() }).from(users).where(eq(users.isActive, false))

    const tpaUsers = await db.select({ count: count() }).from(users).where(eq(users.role, "tpa"))
    const facilityUsers = await db.select({ count: count() }).from(users).where(eq(users.role, "facility"))
    const adminUsers = await db.select({ count: count() }).from(users).where(eq(users.role, "nhis_admin"))

    return NextResponse.json({
      total: totalUsers[0].count,
      active: activeUsers[0].count,
      inactive: inactiveUsers[0].count,
      byRole: {
        tpa: tpaUsers[0].count,
        facility: facilityUsers[0].count,
        admin: adminUsers[0].count,
      },
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
