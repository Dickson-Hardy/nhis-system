import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { errorLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "tpa") {
      return NextResponse.json({ error: "Access denied - TPA only" }, { status: 403 })
    }

    if (!user.tpaId) {
      return NextResponse.json({ error: "TPA ID not found" }, { status: 400 })
    }

    // Get error logs for this TPA
    const tpaErrors = await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.tpaId, user.tpaId))

    // Get error statistics
    const totalErrors = tpaErrors.length
    const openErrors = tpaErrors.filter(e => e.status === 'open').length
    const resolvedErrors = tpaErrors.filter(e => e.status === 'resolved').length
    const criticalErrors = tpaErrors.filter(e => e.severity === 'critical').length
    const highErrors = tpaErrors.filter(e => e.severity === 'high').length
    const mediumErrors = tpaErrors.filter(e => e.severity === 'medium').length
    const lowErrors = tpaErrors.filter(e => e.severity === 'low').length

    const errorsByCategory: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}

    tpaErrors.forEach(error => {
      errorsByCategory[error.errorCategory] = (errorsByCategory[error.errorCategory] || 0) + 1
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1
    })

    const statistics = {
      totalErrors,
      openErrors,
      resolvedErrors,
      criticalErrors,
      highErrors,
      mediumErrors,
      lowErrors,
      errorsByCategory,
      errorsByType
    }

    return NextResponse.json({
      errorLogs: tpaErrors,
      statistics
    })
  } catch (error) {
    console.error("Error fetching TPA error logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "tpa") {
      return NextResponse.json({ error: "Access denied - TPA only" }, { status: 403 })
    }

    const body = await request.json()
    const { errorLogId, resolution, status } = body

    // Update error log status
    await db
      .update(errorLogs)
      .set({
        status: status || 'resolved',
        resolution: resolution || '',
        updatedAt: new Date()
      })
      .where(eq(errorLogs.id, errorLogId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating error log:", error)
    return NextResponse.json(
      { error: "Failed to update error log" },
      { status: 500 }
    )
  }
}
