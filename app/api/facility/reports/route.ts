import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { claims, batches, tpas } from "@/lib/db/schema"
import { eq, and, desc, count, sum, gte, lte, sql } from "drizzle-orm"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

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

    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const exportFormat = url.searchParams.get("export")

    // Parse dates or use default (last 12 months)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : subMonths(end, 11)

    // Base conditions
    const baseConditions = [
      eq(claims.facilityId, user.facilityId),
      gte(claims.createdAt, start),
      lte(claims.createdAt, end)
    ]

    // 1. Key Performance Indicators (KPIs)
    const kpis = await db
      .select({
        totalClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
        approvedClaims: count(),
        rejectedClaims: count(),
        averageProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${claims.updatedAt} - ${claims.createdAt}))/86400)`
      })
      .from(claims)
      .where(and(...baseConditions))

    const kpiData = {
      totalClaims: Number(kpis[0]?.totalClaims || 0),
      totalAmount: Number(kpis[0]?.totalAmount || 0),
      approvalRate: kpis[0]?.totalClaims ? 
        ((Number(kpis[0]?.approvedClaims || 0) / Number(kpis[0]?.totalClaims)) * 100).toFixed(1) : 0,
      averageProcessingTime: Number(kpis[0]?.averageProcessingTime || 0).toFixed(1)
    }

    // 2. Claims Status Distribution
    const statusDistribution = await db
      .select({
        status: claims.status,
        count: count(),
        amount: sum(claims.totalCostOfCare)
      })
      .from(claims)
      .where(and(...baseConditions))
      .groupBy(claims.status)

    // 3. Monthly Trends (last 12 months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`,
        count: count(),
        amount: sum(claims.totalCostOfCare)
      })
      .from(claims)
      .where(and(...baseConditions))
      .groupBy(sql<string>`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`)
      .orderBy(sql<string>`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`)

    // 4. TPA Performance Analysis
    const tpaPerformance = await db
      .select({
        tpaName: tpas.name,
        tpaCode: tpas.code,
        totalClaims: count(),
        approvedClaims: count(),
        rejectedClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
        averageProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${claims.updatedAt} - ${claims.createdAt}))/86400)`
      })
      .from(claims)
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .where(and(...baseConditions))
      .groupBy(tpas.id, tpas.name, tpas.code)

    // 5. Top Diagnoses
    const topDiagnoses = await db
      .select({
        diagnosis: claims.primaryDiagnosis,
        count: count(),
        amount: sum(claims.totalCostOfCare)
      })
      .from(claims)
      .where(and(...baseConditions))
      .groupBy(claims.primaryDiagnosis)
      .orderBy(desc(count()))
      .limit(10)

    // 6. Batch Performance
    const batchPerformance = await db
      .select({
        batchNumber: batches.batchNumber,
        status: batches.status,
        totalClaims: batches.totalClaims,
        completedClaims: batches.completedClaims,
        totalAmount: batches.totalAmount,
        approvedAmount: batches.approvedAmount,
        submissionDate: batches.submittedAt
      })
      .from(batches)
      .where(
        and(
          eq(batches.facilityId, user.facilityId),
          gte(batches.createdAt, start),
          lte(batches.createdAt, end)
        )
      )
      .orderBy(desc(batches.createdAt))

    // 7. Financial Summary
    const financialSummary = await db
      .select({
        totalSubmitted: sum(claims.totalCostOfCare),
        totalApproved: sum(claims.totalCostOfCare),
        totalRejected: sum(claims.totalCostOfCare),
        averageClaimValue: sql<number>`AVG(${claims.totalCostOfCare})`
      })
      .from(claims)
      .where(
        and(
          ...baseConditions,
          eq(claims.status, "verified_paid")
        )
      )

    const reportData = {
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd')
      },
      kpis: kpiData,
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: Number(item.count),
        amount: Number(item.amount || 0)
      })),
      monthlyTrends: monthlyTrends.map(item => ({
        month: item.month,
        count: Number(item.count),
        amount: Number(item.amount || 0)
      })),
      tpaPerformance: tpaPerformance.map(item => ({
        tpaName: item.tpaName,
        tpaCode: item.tpaCode,
        totalClaims: Number(item.totalClaims),
        approvedClaims: Number(item.approvedClaims),
        rejectedClaims: Number(item.rejectedClaims),
        totalAmount: Number(item.totalAmount || 0),
        averageProcessingTime: Number(item.averageProcessingTime || 0).toFixed(1)
      })),
      topDiagnoses: topDiagnoses.map(item => ({
        diagnosis: item.diagnosis,
        count: Number(item.count),
        amount: Number(item.amount || 0)
      })),
      batchPerformance: batchPerformance.map(item => ({
        batchNumber: item.batchNumber,
        status: item.status,
        totalClaims: Number(item.totalClaims || 0),
        completedClaims: Number(item.completedClaims || 0),
        totalAmount: Number(item.totalAmount || 0),
        approvedAmount: Number(item.approvedAmount || 0),
        submissionDate: item.submissionDate
      })),
      financialSummary: {
        totalSubmitted: Number(financialSummary[0]?.totalSubmitted || 0),
        totalApproved: Number(financialSummary[0]?.totalApproved || 0),
        totalRejected: Number(financialSummary[0]?.totalRejected || 0),
        averageClaimValue: Number(financialSummary[0]?.averageClaimValue || 0).toFixed(2)
      }
    }

    // Handle export requests
    if (exportFormat === 'csv') {
      return generateCSVExport(reportData)
    } else if (exportFormat === 'excel') {
      return generateExcelExport(reportData)
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating facility reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCSVExport(data: any) {
  // Generate CSV content
  const csvContent = generateCSVContent(data)
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="facility-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`
    }
  })
}

function generateExcelExport(data: any) {
  // For now, return CSV as Excel (you can implement proper Excel generation later)
  const csvContent = generateCSVContent(data)
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="facility-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`
    }
  })
}

function generateCSVContent(data: any): string {
  const lines: string[] = []
  
  // Header
  lines.push('Facility Report')
  lines.push(`Period: ${data.period.start} to ${data.period.end}`)
  lines.push('')
  
  // KPIs
  lines.push('Key Performance Indicators')
  lines.push('Metric,Value')
  lines.push(`Total Claims,${data.kpis.totalClaims}`)
  lines.push(`Total Amount,${data.kpis.totalAmount}`)
  lines.push(`Approval Rate,${data.kpis.approvalRate}%`)
  lines.push(`Average Processing Time,${data.kpis.averageProcessingTime} days`)
  lines.push('')
  
  // Status Distribution
  lines.push('Claims Status Distribution')
  lines.push('Status,Count,Amount')
  data.statusDistribution.forEach((item: any) => {
    lines.push(`${item.status},${item.count},${item.amount}`)
  })
  lines.push('')
  
  // Monthly Trends
  lines.push('Monthly Trends')
  lines.push('Month,Count,Amount')
  data.monthlyTrends.forEach((item: any) => {
    lines.push(`${item.month},${item.count},${item.amount}`)
  })
  lines.push('')
  
  // TPA Performance
  lines.push('TPA Performance')
  lines.push('TPA,Total Claims,Approved,Rejected,Total Amount,Avg Processing Time')
  data.tpaPerformance.forEach((item: any) => {
    lines.push(`${item.tpaName},${item.totalClaims},${item.approvedClaims},${item.rejectedClaims},${item.totalAmount},${item.averageProcessingTime}`)
  })
  
  return lines.join('\n')
}
