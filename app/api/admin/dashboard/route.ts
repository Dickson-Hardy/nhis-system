import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, tpas, facilities, users, batches, errorLogs, reimbursements, advancePayments } from "@/lib/db/schema"
import { eq, and, isNull, isNotNull, sql, count, sum, desc, gte, lte } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get admin session using custom auth
    const user = await getCurrentUser()
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Parse date filters from query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    // Build date filter conditions
    const dateConditions: any[] = []
    if (startDate) {
      dateConditions.push(gte(claims.createdAt, new Date(startDate)))
    }
    if (endDate) {
      dateConditions.push(lte(claims.createdAt, new Date(endDate)))
    }
    const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined

    // Get comprehensive dashboard statistics
    const [
      totalClaims,
      totalTPAs,
      totalFacilities,
      totalUsers,
      claimsByStatus,
      financialSummary,
      tpaPerformance,
      duplicateClaims,
      errorSummary,
      geographicData,
      recentActivity,
      tpaFinancialBreakdown,
      impactMetrics
    ] = await Promise.all([
      // Basic counts
      db.select({ count: count() }).from(claims).where(dateFilter),
      db.select({ count: count() }).from(tpas).where(eq(tpas.isActive, true)),
      db.select({ count: count() }).from(facilities).where(eq(facilities.isActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),

      // Claims by status
      db.select({
        status: claims.status,
        count: count(),
        totalAmount: sum(claims.totalCostOfCare)
      }).from(claims).where(dateFilter).groupBy(claims.status),

      // Financial summary
      db.select({
        totalSubmitted: sum(claims.totalCostOfCare),
        totalApproved: sum(claims.approvedCostOfCare),
        avgClaimAmount: sql<number>`AVG(${claims.totalCostOfCare})`,
        totalClaims: count()
      }).from(claims).where(dateFilter),

      // TPA performance
      db.select({
        tpaId: claims.tpaId,
        tpaName: tpas.name,
        totalClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
        approvedAmount: sum(claims.approvedCostOfCare),
        verifiedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'verified' THEN 1 ELSE 0 END)`,
        rejectedClaims: sql<number>`SUM(CASE WHEN ${claims.status} = 'rejected' THEN 1 ELSE 0 END)`
      })
      .from(claims)
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .where(dateFilter)
      .groupBy(claims.tpaId, tpas.name)
      .orderBy(desc(count())),

      // Duplicate claims detection
      db.select({
        uniqueClaimId: claims.uniqueClaimId,
        count: count(),
        totalAmount: sum(claims.totalCostOfCare)
      })
      .from(claims)
      .where(dateFilter)
      .groupBy(claims.uniqueClaimId)
      .having(sql`COUNT(*) > 1`)
      .orderBy(desc(count())),

      // Error summary
      db.select({
        errorType: errorLogs.errorType,
        severity: errorLogs.severity,
        count: count()
      })
      .from(errorLogs)
      .groupBy(errorLogs.errorType, errorLogs.severity),

      // Geographic distribution
      db.select({
        state: facilities.state,
        totalClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
        facilities: sql<number>`COUNT(DISTINCT ${facilities.id})`,
        avgClaimAmount: sql<number>`AVG(${claims.totalCostOfCare})`
      })
      .from(claims)
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .where(and(isNotNull(facilities.state), dateFilter))
      .groupBy(facilities.state)
      .orderBy(desc(count())),

      // Recent claims for review
      db.select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        beneficiaryName: claims.beneficiaryName,
        totalCostOfCare: claims.totalCostOfCare,
        approvedCostOfCare: claims.approvedCostOfCare,
        status: claims.status,
        decision: claims.decision,
        createdAt: claims.createdAt,
        closedAt: claims.updatedAt,
        batchNumber: claims.batchNumber,
        tpaName: tpas.name,
        facilityName: facilities.name
      })
      .from(claims)
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .where(and(
        isNotNull(claims.createdAt),
        eq(claims.status, 'closed'),
        dateFilter
      ))
      .orderBy(desc(claims.updatedAt))
      .limit(10),

      // TPA Financial Breakdown by Decision Status (matching spreadsheet context)
      db.select({
        tpaId: claims.tpaId,
        tpaName: tpas.name,
        status: claims.status,
        decision: claims.decision,
        totalAmount: sum(claims.totalCostOfCare),
        approvedAmount: sum(claims.approvedCostOfCare),
        claimCount: count()
      })
      .from(claims)
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .where(dateFilter)
      .groupBy(claims.tpaId, tpas.name, claims.status, claims.decision)
      .orderBy(desc(sum(claims.totalCostOfCare))),

      // Impact Metrics (matching spreadsheet context)
      db.select({
        womenTreated: sql<number>`COUNT(DISTINCT CASE WHEN ${claims.beneficiaryGender} = 'Female' THEN ${claims.beneficiaryName} END)`,
        claimsVerified: sql<number>`COUNT(CASE WHEN ${claims.status} IN ('verified', 'verified_awaiting_payment', 'verified_paid') THEN 1 END)`,
        totalClaimsReceived: count(),
        totalBeneficiaries: sql<number>`COUNT(DISTINCT ${claims.beneficiaryName})`
      })
      .from(claims)
      .where(dateFilter)
    ])

    // Process status breakdown
    const statusBreakdown = (claimsByStatus || []).reduce((acc, item) => {
      acc[item.status || 'unknown'] = {
        count: item.count,
        amount: Number(item.totalAmount || 0)
      }
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    // Calculate approval rates and processing metrics
    const totalProcessedClaims = (statusBreakdown.verified?.count || 0) + (statusBreakdown.rejected?.count || 0)
    const approvalRate = totalProcessedClaims > 0 ? ((statusBreakdown.verified?.count || 0) / totalProcessedClaims) * 100 : 0

    // Process TPA performance data
    const tpaStats = (tpaPerformance || []).map(tpa => ({
      ...tpa,
      approvalRate: tpa.totalClaims > 0 ? ((tpa.verifiedClaims || 0) / tpa.totalClaims) * 100 : 0,
      rejectionRate: tpa.totalClaims > 0 ? ((tpa.rejectedClaims || 0) / tpa.totalClaims) * 100 : 0,
      avgClaimAmount: tpa.totalClaims > 0 ? Number(tpa.totalAmount || 0) / tpa.totalClaims : 0
    }))

    // Process TPA Financial Breakdown by Decision Status
    const tpaFinancialData = (tpaFinancialBreakdown || []).reduce((acc, item) => {
      const tpaName = item.tpaName || 'Unknown TPA'
      const status = item.status || 'unknown'
      
      if (!acc[tpaName]) {
        acc[tpaName] = {
          tpaName,
          tpaId: item.tpaId,
          totalAmount: 0,
          approvedAmount: 0,
          totalClaims: 0,
          breakdown: {}
        }
      }
      
      acc[tpaName].totalAmount += Number(item.totalAmount || 0)
      acc[tpaName].approvedAmount += Number(item.approvedAmount || 0)
      acc[tpaName].totalClaims += item.claimCount
      acc[tpaName].breakdown[status] = {
        amount: Number(item.totalAmount || 0),
        approvedAmount: Number(item.approvedAmount || 0),
        count: item.claimCount
      }
      
      return acc
    }, {} as Record<string, any>)

    // Quality indicators
    const qualityMetrics = {
      totalDuplicates: (duplicateClaims || []).length,
      duplicateAmount: (duplicateClaims || []).reduce((sum, dup) => sum + Number(dup.totalAmount || 0), 0),
      errorsByType: (errorSummary || []).reduce((acc, error) => {
        if (!acc[error.errorType]) acc[error.errorType] = 0
        acc[error.errorType] += error.count
        return acc
      }, {} as Record<string, number>),
      errorsBySeverity: (errorSummary || []).reduce((acc, error) => {
        if (!acc[error.severity]) acc[error.severity] = 0
        acc[error.severity] += error.count
        return acc
      }, {} as Record<string, number>)
    }

    const stats = {
      totalClaims: totalClaims[0]?.count || 0,
      totalTPAs: totalTPAs[0]?.count || 0,
      totalFacilities: totalFacilities[0]?.count || 0,
      totalUsers: totalUsers[0]?.count || 0,
      pendingClaims: statusBreakdown.closed?.count || 0,
      approvalRate: Math.round(approvalRate * 100) / 100,
      totalSubmittedAmount: Number(financialSummary[0]?.totalSubmitted || 0),
      totalApprovedAmount: Number(financialSummary[0]?.totalApproved || 0),
      avgClaimAmount: Number(financialSummary[0]?.avgClaimAmount || 0)
    }

    // Impact metrics
    const impact = impactMetrics[0] ? {
      womenTreated: impactMetrics[0].womenTreated || 0,
      claimsVerified: impactMetrics[0].claimsVerified || 0,
      totalClaimsReceived: impactMetrics[0].totalClaimsReceived || 0,
      totalBeneficiaries: impactMetrics[0].totalBeneficiaries || 0
    } : {
      womenTreated: 0,
      claimsVerified: 0,
      totalClaimsReceived: 0,
      totalBeneficiaries: 0
    }

    return NextResponse.json({
      stats,
      statusBreakdown,
      financialSummary: {
        totalSubmitted: Number(financialSummary[0]?.totalSubmitted || 0),
        totalApproved: Number(financialSummary[0]?.totalApproved || 0),
        pendingAmount: statusBreakdown.closed?.amount || 0,
        avgClaimAmount: Number(financialSummary[0]?.avgClaimAmount || 0)
      },
      tpaPerformance: tpaStats,
      tpaFinancialBreakdown: Object.values(tpaFinancialData),
      impactMetrics: impact,
      qualityMetrics,
      geographicData: (geographicData || []).map(item => ({
        state: item.state,
        totalClaims: item.totalClaims,
        totalAmount: Number(item.totalAmount || 0),
        facilities: item.facilities,
        avgClaimAmount: Number(item.avgClaimAmount || 0)
      })),
      recentClaims: recentActivity || []
    })
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
