import { type NextRequest, NextResponse } from "next/server"
import { db, claims, facilities } from "@/lib/db"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/dashboard/reports - Generate various reports
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
    const reportType = searchParams.get("type") || "summary"
    const period = searchParams.get("period") || "30"
    const format = searchParams.get("format") || "json"

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    let report: any = {}

    if (reportType === "summary") {
      report = await generateSummaryReport(startDate, endDate, user)
    } else if (reportType === "performance") {
      report = await generatePerformanceReport(startDate, endDate, user)
    } else if (reportType === "financial") {
      report = await generateFinancialReport(startDate, endDate, user)
    }

    return NextResponse.json({
      report,
      metadata: {
        type: reportType,
        period,
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Summary report
async function generateSummaryReport(startDate: Date, endDate: Date, user: any) {
  const roleConditions: any[] = []
  if (user.role === "tpa") {
    roleConditions.push(eq(claims.tpaId, user.tpaId))
  } else if (user.role === "facility") {
    roleConditions.push(eq(claims.facilityId, user.facilityId))
  }

  const whereClause = roleConditions.length > 0 ? and(...roleConditions) : undefined

  // Overall metrics
  const overallMetrics = await db
    .select({
      totalClaims: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${claims.totalCostOfCare})`,
      approvedAmount: sql<string>`SUM(CASE WHEN ${claims.status} = 'approved' THEN ${claims.approvedCostOfCare} ELSE 0 END)`,
      approvalRate: sql<number>`ROUND(COUNT(CASE WHEN ${claims.status} = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2)`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))

  // Top performing facilities (for TPA and Admin)
  let topFacilities: any[] = []
  if (user.role !== "facility") {
    const facilityConditions = user.role === "tpa" ? [eq(claims.tpaId, user.tpaId)] : []
    const facilityWhereClause = facilityConditions.length > 0 ? and(...facilityConditions) : undefined

    topFacilities = await db
      .select({
        facilityName: facilities.name,
        facilityCode: facilities.code,
        claimsCount: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`SUM(${claims.totalCostOfCare})`,
        approvalRate: sql<number>`ROUND(COUNT(CASE WHEN ${claims.status} = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2)`,
      })
      .from(claims)
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .where(and(facilityWhereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
      .groupBy(facilities.id, facilities.name, facilities.code)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10)
  }

  return {
    period: { startDate, endDate },
    metrics: overallMetrics[0],
    topFacilities,
  }
}

// Performance report
async function generatePerformanceReport(startDate: Date, endDate: Date, user: any) {
  // Processing time analysis
  const processingTimes = await db
    .select({
      avgProcessingDays: sql<number>`AVG(EXTRACT(DAY FROM (${claims.updatedAt} - ${claims.createdAt})))`,
      medianProcessingDays: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(DAY FROM (${claims.updatedAt} - ${claims.createdAt})))`,
    })
    .from(claims)
    .where(and(gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))

  // Rejection analysis
  const rejectionAnalysis = await db
    .select({
      reason: claims.reasonForRejection,
      count: sql<number>`COUNT(*)`,
      percentage: sql<number>`ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${claims} WHERE ${claims.status} = 'rejected'), 2)`,
    })
    .from(claims)
    .where(and(eq(claims.status, "rejected"), gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
    .groupBy(claims.reasonForRejection)
    .orderBy(sql`COUNT(*) DESC`)

  return {
    processingTimes: processingTimes[0],
    rejectionAnalysis,
  }
}

// Financial report
async function generateFinancialReport(startDate: Date, endDate: Date, user: any) {
  const roleConditions: any[] = []
  if (user.role === "tpa") {
    roleConditions.push(eq(claims.tpaId, user.tpaId))
  } else if (user.role === "facility") {
    roleConditions.push(eq(claims.facilityId, user.facilityId))
  }

  const whereClause = roleConditions.length > 0 ? and(...roleConditions) : undefined

  // Financial summary
  const financialSummary = await db
    .select({
      totalClaimed: sql<string>`SUM(${claims.totalCostOfCare})`,
      totalApproved: sql<string>`SUM(${claims.approvedCostOfCare})`,
      totalInvestigation: sql<string>`SUM(${claims.costOfInvestigation})`,
      totalProcedure: sql<string>`SUM(${claims.costOfProcedure})`,
      totalMedication: sql<string>`SUM(${claims.costOfMedication})`,
      totalOtherServices: sql<string>`SUM(${claims.costOfOtherServices})`,
      avgClaimValue: sql<string>`AVG(${claims.totalCostOfCare})`,
    })
    .from(claims)
    .where(and(whereClause, gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))

  // Cost trends by month
  const costTrends = await db
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

  return {
    summary: financialSummary[0],
    trends: costTrends,
  }
}
