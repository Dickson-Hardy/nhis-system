import { type NextRequest, NextResponse } from "next/server"
import { db, claims, batches } from "@/lib/db"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/dashboard/analytics - Get detailed analytics data
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
    const type = searchParams.get("type") || "claims" // claims, batches, financial

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    let analytics: any = {}

    // Build role-based where conditions
    const roleConditions: any[] = []
    if (user.role === "tpa") {
      roleConditions.push(eq(claims.tpaId, user.tpaId))
    } else if (user.role === "facility") {
      roleConditions.push(eq(claims.facilityId, user.facilityId))
    }

    if (type === "claims") {
      analytics = await getClaimsAnalytics(startDate, endDate, roleConditions)
    } else if (type === "batches") {
      analytics = await getBatchesAnalytics(startDate, endDate, roleConditions, user)
    } else if (type === "financial") {
      analytics = await getFinancialAnalytics(startDate, endDate, roleConditions)
    }

    return NextResponse.json({ analytics, period, type })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Claims analytics
async function getClaimsAnalytics(startDate: Date, endDate: Date, roleConditions: any[]) {
  const whereClause = roleConditions.length > 0 ? and(...roleConditions) : undefined

  // Claims trend over time (daily)
  const claimsTrend = await db
    .select({
      date: sql<string>`DATE(${claims.createdAt})`,
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${claims.totalCostOfCare})`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
    .groupBy(sql`DATE(${claims.createdAt})`)
    .orderBy(sql`DATE(${claims.createdAt})`)

  // Claims by status
  const claimsByStatus = await db
    .select({
      status: claims.status,
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${claims.totalCostOfCare})`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
    .groupBy(claims.status)

  // Top diagnoses
  const topDiagnoses = await db
    .select({
      diagnosis: claims.primaryDiagnosis,
      count: sql<number>`COUNT(*)`,
      avgCost: sql<string>`AVG(${claims.totalCostOfCare})`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
    .groupBy(claims.primaryDiagnosis)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10)

  return {
    trend: claimsTrend,
    byStatus: claimsByStatus,
    topDiagnoses,
  }
}

// Batches analytics
async function getBatchesAnalytics(startDate: Date, endDate: Date, roleConditions: any[], user: any) {
  const batchWhereClause = user.role === "tpa" ? eq(batches.tpaId, user.tpaId) : undefined

  // Batch processing time analysis
  const batchProcessingTimes = await db
    .select({
      batchNumber: batches.batchNumber,
      submittedAt: batches.submittedAt,
      reviewedAt: batches.reviewedAt,
      status: batches.status,
      totalClaims: batches.totalClaims,
      totalAmount: batches.totalAmount,
    })
    .from(batches)
    .where(and(batchWhereClause, gte(batches.createdAt, startDate), lte(batches.createdAt, endDate)))
    .orderBy(batches.createdAt)

  // Batch status distribution
  const batchesByStatus = await db
    .select({
      status: batches.status,
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${batches.totalAmount})`,
    })
    .from(batches)
    .where(and(batchWhereClause, gte(batches.createdAt, startDate), lte(batches.createdAt, endDate)))
    .groupBy(batches.status)

  return {
    processingTimes: batchProcessingTimes,
    byStatus: batchesByStatus,
  }
}

// Financial analytics
async function getFinancialAnalytics(startDate: Date, endDate: Date, roleConditions: any[]) {
  const whereClause = roleConditions.length > 0 ? and(...roleConditions) : undefined

  // Monthly financial summary
  const monthlyFinancials = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${claims.createdAt})`,
      totalClaimed: sql<string>`SUM(${claims.totalCostOfCare})`,
      totalApproved: sql<string>`SUM(${claims.approvedCostOfCare})`,
      claimsCount: sql<number>`COUNT(*)`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
    .groupBy(sql`DATE_TRUNC('month', ${claims.createdAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${claims.createdAt})`)

  // Cost breakdown by category
  const costBreakdown = await db
    .select({
      totalInvestigation: sql<string>`SUM(${claims.costOfInvestigation})`,
      totalProcedure: sql<string>`SUM(${claims.costOfProcedure})`,
      totalMedication: sql<string>`SUM(${claims.costOfMedication})`,
      totalOtherServices: sql<string>`SUM(${claims.costOfOtherServices})`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))

  return {
    monthly: monthlyFinancials,
    breakdown: costBreakdown[0],
  }
}
