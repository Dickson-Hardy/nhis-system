import { type NextRequest, NextResponse } from "next/server"
import { db, facilities } from "@/lib/db"
import { sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/facilities/states - Get list of states with facilities
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get distinct states with facility counts
    const states = await db
      .select({
        state: facilities.state,
        facilityCount: sql<number>`COUNT(*)`,
        activeFacilityCount: sql<number>`COUNT(CASE WHEN ${facilities.isActive} = true THEN 1 END)`,
      })
      .from(facilities)
      .groupBy(facilities.state)
      .orderBy(facilities.state)

    return NextResponse.json({ states })
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
