import { type NextRequest, NextResponse } from "next/server"
import { db, facilities, claims } from "@/lib/db"
import { eq, count, sum, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/facilities/stats - Get facility statistics
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

    // Role-based statistics
    let stats: any = {}

    if (user.role === "nhis_admin") {
      // System-wide facility statistics
      const totalFacilities = await db.select({ count: count() }).from(facilities)
      const activeFacilities = await db.select({ count: count() }).from(facilities).where(eq(facilities.isActive, true))
      const inactiveFacilities = await db
        .select({ count: count() })
        .from(facilities)
        .where(eq(facilities.isActive, false))

      // Facilities by state
      const facilitiesByState = await db
        .select({
          state: facilities.state,
          count: count(),
        })
        .from(facilities)
        .where(eq(facilities.isActive, true))
        .groupBy(facilities.state)
        .orderBy(sql`COUNT(*) DESC`)

      // Top performing facilities
      const topFacilities = await db
        .select({
          facilityId: facilities.id,
          facilityName: facilities.name,
          facilityCode: facilities.code,
          state: facilities.state,
          totalClaims: count(claims.id),
          totalAmount: sum(claims.totalCostOfCare),
          approvedAmount: sum(claims.approvedCostOfCare),
        })
        .from(facilities)
        .leftJoin(claims, eq(facilities.id, claims.facilityId))
        .where(eq(facilities.isActive, true))
        .groupBy(facilities.id, facilities.name, facilities.code, facilities.state)
        .orderBy(sql`COUNT(${claims.id}) DESC`)
        .limit(10)

      stats = {
        overview: {
          total: totalFacilities[0].count,
          active: activeFacilities[0].count,
          inactive: inactiveFacilities[0].count,
        },
        byState: facilitiesByState,
        topPerforming: topFacilities,
      }
    } else if (user.role === "tpa") {
      // TPA-specific facility statistics
      const tpaFacilities = await db.select({ count: count() }).from(facilities).where(eq(facilities.tpaId, user.tpaId))

      const activeTpaFacilities = await db
        .select({ count: count() })
        .from(facilities)
        .where(eq(facilities.tpaId, user.tpaId) && eq(facilities.isActive, true))

      // TPA facilities performance
      const facilitiesPerformance = await db
        .select({
          facilityId: facilities.id,
          facilityName: facilities.name,
          facilityCode: facilities.code,
          state: facilities.state,
          totalClaims: count(claims.id),
          totalAmount: sum(claims.totalCostOfCare),
          approvedAmount: sum(claims.approvedCostOfCare),
          approvalRate: sql<number>`ROUND(COUNT(CASE WHEN ${claims.status} = 'approved' THEN 1 END) * 100.0 / COUNT(${claims.id}), 2)`,
        })
        .from(facilities)
        .leftJoin(claims, eq(facilities.id, claims.facilityId))
        .where(eq(facilities.tpaId, user.tpaId))
        .groupBy(facilities.id, facilities.name, facilities.code, facilities.state)
        .orderBy(sql`COUNT(${claims.id}) DESC`)

      stats = {
        overview: {
          total: tpaFacilities[0].count,
          active: activeTpaFacilities[0].count,
        },
        performance: facilitiesPerformance,
      }
    } else if (user.role === "facility") {
      // Individual facility statistics
      const facilityStats = await db
        .select({
          totalClaims: count(claims.id),
          totalAmount: sum(claims.totalCostOfCare),
          approvedAmount: sum(claims.approvedCostOfCare),
          pendingClaims: sql<number>`COUNT(CASE WHEN ${claims.status} = 'pending' THEN 1 END)`,
          approvedClaims: sql<number>`COUNT(CASE WHEN ${claims.status} = 'approved' THEN 1 END)`,
          rejectedClaims: sql<number>`COUNT(CASE WHEN ${claims.status} = 'rejected' THEN 1 END)`,
        })
        .from(claims)
        .where(eq(claims.facilityId, user.facilityId))

      stats = {
        overview: facilityStats[0],
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching facility stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
