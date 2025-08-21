import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { errorLogs, tpas, facilities } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get admin session using custom auth
    const user = await getCurrentUser()
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Get all error logs with TPA and facility information
    const allErrors = await db
      .select({
        id: errorLogs.id,
        batchId: errorLogs.batchId,
        claimId: errorLogs.claimId,
        tpaId: errorLogs.tpaId,
        facilityId: errorLogs.facilityId,
        errorType: errorLogs.errorType,
        errorCategory: errorLogs.errorCategory,
        severity: errorLogs.severity,
        errorCode: errorLogs.errorCode,
        errorTitle: errorLogs.errorTitle,
        errorDescription: errorLogs.errorDescription,
        fieldName: errorLogs.fieldName,
        expectedValue: errorLogs.expectedValue,
        actualValue: errorLogs.actualValue,
        expectedAmount: errorLogs.expectedAmount,
        actualAmount: errorLogs.actualAmount,
        amountDeviation: errorLogs.amountDeviation,
        deviationPercentage: errorLogs.deviationPercentage,
        status: errorLogs.status,
        resolution: errorLogs.resolution,
        createdAt: errorLogs.createdAt,
        updatedAt: errorLogs.updatedAt,
        tpaName: tpas.name,
        facilityName: facilities.name
      })
      .from(errorLogs)
      .leftJoin(tpas, eq(errorLogs.tpaId, tpas.id))
      .leftJoin(facilities, eq(errorLogs.facilityId, facilities.id))

    // Get error statistics
    const totalErrors = allErrors.length
    const openErrors = allErrors.filter(e => e.status === 'open').length
    const resolvedErrors = allErrors.filter(e => e.status === 'resolved').length
    const escalatedErrors = allErrors.filter(e => e.status === 'escalated').length
    const criticalErrors = allErrors.filter(e => e.severity === 'critical').length
    const highErrors = allErrors.filter(e => e.severity === 'high').length
    const mediumErrors = allErrors.filter(e => e.severity === 'medium').length
    const lowErrors = allErrors.filter(e => e.severity === 'low').length

    const errorsByCategory: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    const errorsByTpa: Record<string, number> = {}

    allErrors.forEach(error => {
      if (error.errorCategory) {
        errorsByCategory[error.errorCategory] = (errorsByCategory[error.errorCategory] || 0) + 1
      }
      if (error.errorType) {
        errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1
      }
      
      const tpaName = error.tpaName || 'Unknown TPA'
      errorsByTpa[tpaName] = (errorsByTpa[tpaName] || 0) + 1
    })

    const statistics = {
      totalErrors,
      openErrors,
      resolvedErrors,
      escalatedErrors,
      criticalErrors,
      highErrors,
      mediumErrors,
      lowErrors,
      errorsByCategory,
      errorsByType,
      errorsByTpa
    }

    return NextResponse.json({
      errorLogs: allErrors,
      statistics
    })
  } catch (error) {
    console.error("Error fetching admin error logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { errorLogId, action, notes } = body

    if (action === 'escalate') {
      // Escalate error
      await db
        .update(errorLogs)
        .set({
          status: 'escalated',
          updatedAt: new Date()
        })
        .where(eq(errorLogs.id, errorLogId))
    } else if (action === 'resolve') {
      // Resolve error
      await db
        .update(errorLogs)
        .set({
          status: 'resolved',
          resolution: notes || '',
          updatedAt: new Date()
        })
        .where(eq(errorLogs.id, errorLogId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating error log:", error)
    return NextResponse.json(
      { error: "Failed to update error log" },
      { status: 500 }
    )
  }
}
