import { type NextRequest, NextResponse } from "next/server"
import { db, claims, batches, facilities, tpas } from "@/lib/db"
import { eq, and, count, sum, gte, desc } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/dashboard/stats - Get dashboard statistics based on user role
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    let stats: any = {}

    if (user.role === "nhis_admin") {
      // Admin gets system-wide statistics
      stats = await getAdminStats(startDate)
    } else if (user.role === "tpa") {
      // TPA gets their specific statistics
      stats = await getTpaStats(user.tpaId, startDate)
    } else if (user.role === "facility") {
      // Facility gets their specific statistics
      stats = await getFacilityStats(user.facilityId, startDate)
    }

    return NextResponse.json({ stats, period })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Admin statistics
async function getAdminStats(startDate: Date) {
  // Total claims
  const totalClaims = await db.select({ count: count() }).from(claims)
  const recentClaimsCount = await db.select({ count: count() }).from(claims).where(gte(claims.createdAt, startDate))

  // Claims by status
  const pendingClaims = await db.select({ count: count() }).from(claims).where(eq(claims.status, "pending"))
  const approvedClaims = await db.select({ count: count() }).from(claims).where(eq(claims.status, "approved"))
  const rejectedClaims = await db.select({ count: count() }).from(claims).where(eq(claims.status, "rejected"))

  // Financial data
  const totalAmount = await db.select({ total: sum(claims.totalCostOfCare) }).from(claims)
  const approvedAmount = await db
    .select({ total: sum(claims.approvedCostOfCare) })
    .from(claims)
    .where(eq(claims.status, "approved"))

  // Batches
  const totalBatches = await db.select({ count: count() }).from(batches)
  const pendingBatches = await db.select({ count: count() }).from(batches).where(eq(batches.status, "submitted"))

  // Active entities
  const activeTpas = await db.select({ count: count() }).from(tpas).where(eq(tpas.isActive, true))
  const activeFacilities = await db.select({ count: count() }).from(facilities).where(eq(facilities.isActive, true))

  // Recent activity
  const recentActivity = await db
    .select({
      id: claims.id,
      beneficiaryName: claims.beneficiaryName,
      totalCostOfCare: claims.totalCostOfCare,
      status: claims.status,
      createdAt: claims.createdAt,
      facilityName: facilities.name,
      tpaName: tpas.name,
    })
    .from(claims)
    .leftJoin(facilities, eq(claims.facilityId, facilities.id))
    .leftJoin(tpas, eq(claims.tpaId, tpas.id))
    .where(gte(claims.createdAt, startDate))
    .orderBy(desc(claims.createdAt))
    .limit(10)

  return {
    overview: {
      totalClaims: totalClaims[0].count,
      recentClaims: recentClaimsCount[0].count,
      totalAmount: totalAmount[0].total || "0",
      approvedAmount: approvedAmount[0].total || "0",
    },
    claims: {
      pending: pendingClaims[0].count,
      approved: approvedClaims[0].count,
      rejected: rejectedClaims[0].count,
    },
    batches: {
      total: totalBatches[0].count,
      pending: pendingBatches[0].count,
    },
    entities: {
      activeTpas: activeTpas[0].count,
      activeFacilities: activeFacilities[0].count,
    },
    recentActivity,
  }
}

// TPA statistics
async function getTpaStats(tpaId: number, startDate: Date) {
  // TPA-specific claims
  const totalClaims = await db.select({ count: count() }).from(claims).where(eq(claims.tpaId, tpaId))
  const recentClaimsCount = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.tpaId, tpaId), gte(claims.createdAt, startDate)))

  // Claims by status
  const pendingClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.tpaId, tpaId), eq(claims.status, "pending")))
  const approvedClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.tpaId, tpaId), eq(claims.status, "approved")))
  const rejectedClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.tpaId, tpaId), eq(claims.status, "rejected")))

  // Financial data
  const totalAmount = await db
    .select({ total: sum(claims.totalCostOfCare) })
    .from(claims)
    .where(eq(claims.tpaId, tpaId))
  const approvedAmount = await db
    .select({ total: sum(claims.approvedCostOfCare) })
    .from(claims)
    .where(and(eq(claims.tpaId, tpaId), eq(claims.status, "approved")))

  // TPA batches
  const totalBatches = await db.select({ count: count() }).from(batches).where(eq(batches.tpaId, tpaId))
  const pendingBatches = await db
    .select({ count: count() })
    .from(batches)
    .where(and(eq(batches.tpaId, tpaId), eq(batches.status, "submitted")))

  // Partner facilities
  const partnerFacilities = await db
    .select({ count: count() })
    .from(facilities)
    .where(and(eq(facilities.tpaId, tpaId), eq(facilities.isActive, true)))

  // Recent claims
  const recentActivity = await db
    .select({
      id: claims.id,
      beneficiaryName: claims.beneficiaryName,
      totalCostOfCare: claims.totalCostOfCare,
      status: claims.status,
      createdAt: claims.createdAt,
      facilityName: facilities.name,
    })
    .from(claims)
    .leftJoin(facilities, eq(claims.facilityId, facilities.id))
    .where(and(eq(claims.tpaId, tpaId), gte(claims.createdAt, startDate)))
    .orderBy(desc(claims.createdAt))
    .limit(10)

  return {
    overview: {
      totalClaims: totalClaims[0].count,
      recentClaims: recentClaimsCount[0].count,
      totalAmount: totalAmount[0].total || "0",
      approvedAmount: approvedAmount[0].total || "0",
    },
    claims: {
      pending: pendingClaims[0].count,
      approved: approvedClaims[0].count,
      rejected: rejectedClaims[0].count,
    },
    batches: {
      total: totalBatches[0].count,
      pending: pendingBatches[0].count,
    },
    facilities: {
      partners: partnerFacilities[0].count,
    },
    recentActivity,
  }
}

// Facility statistics
async function getFacilityStats(facilityId: number, startDate: Date) {
  // Facility-specific claims
  const totalClaims = await db.select({ count: count() }).from(claims).where(eq(claims.facilityId, facilityId))
  const recentClaimsCount = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), gte(claims.createdAt, startDate)))

  // Claims by status
  const pendingClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), eq(claims.status, "pending")))
  const approvedClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), eq(claims.status, "approved")))
  const rejectedClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), eq(claims.status, "rejected")))

  // Financial data
  const totalAmount = await db
    .select({ total: sum(claims.totalCostOfCare) })
    .from(claims)
    .where(eq(claims.facilityId, facilityId))
  const approvedAmount = await db
    .select({ total: sum(claims.approvedCostOfCare) })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), eq(claims.status, "approved")))

  // Recent claims
  const recentActivity = await db
    .select({
      id: claims.id,
      beneficiaryName: claims.beneficiaryName,
      totalCostOfCare: claims.totalCostOfCare,
      status: claims.status,
      createdAt: claims.createdAt,
    })
    .from(claims)
    .where(and(eq(claims.facilityId, facilityId), gte(claims.createdAt, startDate)))
    .orderBy(desc(claims.createdAt))
    .limit(10)

  return {
    overview: {
      totalClaims: totalClaims[0].count,
      recentClaims: recentClaimsCount[0].count,
      totalAmount: totalAmount[0].total || "0",
      approvedAmount: approvedAmount[0].total || "0",
    },
    claims: {
      pending: pendingClaims[0].count,
      approved: approvedClaims[0].count,
      rejected: rejectedClaims[0].count,
    },
    recentActivity,
  }
}
