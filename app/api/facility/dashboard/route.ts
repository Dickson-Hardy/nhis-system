import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { claims, batches } from "@/lib/db/schema"
import { eq, count, and, desc, gte, sql } from "drizzle-orm"
import { startOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    // Get current month start for growth calculation
    const currentMonthStart = startOfMonth(new Date())

    // Get total claims count
    const totalClaimsResult = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.facilityId, user.facilityId))

    const totalClaims = totalClaimsResult[0]?.count || 0

    // Get pending claims count
    const pendingClaimsResult = await db
      .select({ count: count() })
      .from(claims)
      .where(
        and(
          eq(claims.facilityId, user.facilityId),
          eq(claims.status, "draft")
        )
      )

    const pendingClaims = pendingClaimsResult[0]?.count || 0

    // Get this month's claims for growth calculation
    const thisMonthClaimsResult = await db
      .select({ count: count() })
      .from(claims)
      .where(
        and(
          eq(claims.facilityId, user.facilityId),
          gte(claims.createdAt, currentMonthStart)
        )
      )

    const thisMonthClaims = thisMonthClaimsResult[0]?.count || 0

    // Get total batches count - handle case where batches table might not exist or have different schema
    let totalBatches = 0
    try {
      const totalBatchesResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM batches WHERE facility_id = ${user.facilityId}`
      )
      console.log("Batches query successful:", totalBatchesResult.rows[0])
      totalBatches = parseInt(totalBatchesResult.rows[0]?.count) || 0
    } catch (batchError) {
      console.error("Batches table query failed - table may not exist or have different schema:", batchError)
      // Check if table exists at all
      try {
        const tableExists = await db.execute(
          sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'batches')`
        )
        console.log("Batches table exists:", tableExists.rows[0]?.exists)
        if (!tableExists.rows[0]?.exists) {
          console.log("Batches table does not exist - this is normal for initial setup")
        }
      } catch (checkError) {
        console.error("Could not check if batches table exists:", checkError)
      }
      totalBatches = 0
    }

    // Calculate monthly growth percentage (simplified calculation)
    const monthlyGrowth = totalClaims > 0 ? (thisMonthClaims / totalClaims) * 100 : 0

    // Get recent discharges
    const recentDischarges = await db
      .select({
        id: claims.id,
        patientName: claims.beneficiaryName,
        hospitalNumber: claims.hospitalNumber,
        dischargeDate: claims.dateOfDischarge,
        procedure: claims.treatmentProcedure,
        status: claims.status,
      })
      .from(claims)
      .where(eq(claims.facilityId, user.facilityId))
      .orderBy(desc(claims.createdAt))
      .limit(5)

    const stats = {
      totalPatients: totalClaims, // Using claims as proxy for patients
      totalDischarges: totalClaims,
      pendingClaims,
      monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      totalBatches,
    }

    return NextResponse.json({
      stats,
      recentDischarges,
    })
  } catch (error) {
    console.error("Error fetching facility dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}