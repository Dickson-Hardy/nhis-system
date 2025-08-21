import { NextRequest, NextResponse } from "next/server"
import { eq, and, desc, count, sum } from "drizzle-orm"
import { db } from "@/lib/db"
import { batches, claims, facilities, tpas, users } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/facility/batches - Get all batches for the facility
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
    const status = url.searchParams.get("status")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    // Build query conditions
    const conditions = [eq(batches.facilityId, user.facilityId)]
    if (status) {
      conditions.push(eq(batches.status, status))
    }

    // Get batches with TPA information
    const facilityBatches = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        batchType: batches.batchType,
        weekStartDate: batches.weekStartDate,
        weekEndDate: batches.weekEndDate,
        status: batches.status,
        totalClaims: batches.totalClaims,
        completedClaims: batches.completedClaims,
        totalAmount: batches.totalAmount,
        approvedAmount: batches.approvedAmount,
        adminFeePercentage: batches.adminFeePercentage,
        adminFeeAmount: batches.adminFeeAmount,
        netAmount: batches.netAmount,
        forwardingLetterGenerated: batches.forwardingLetterGenerated,
        coverLetterUrl: batches.coverLetterUrl,
        coverLetterFileName: batches.coverLetterFileName,
        submittedAt: batches.submittedAt,
        createdAt: batches.createdAt,
        updatedAt: batches.updatedAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
        }
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .leftJoin(facilities, eq(batches.facilityId, facilities.id))
      .where(and(...conditions))
      .orderBy(desc(batches.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCount = await db
      .select({ count: count() })
      .from(batches)
      .where(and(...conditions))

    // Get facility statistics
    const facilityStats = await db
      .select({
        totalBatches: count(),
        totalAmount: sum(batches.totalAmount),
        draftBatches: count(),
        submittedBatches: count(),
        approvedBatches: count(),
      })
      .from(batches)
      .where(eq(batches.facilityId, user.facilityId))

    return NextResponse.json({
      batches: facilityBatches,
      pagination: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: totalCount[0].count > offset + limit,
      },
      statistics: facilityStats[0] || {
        totalBatches: 0,
        totalAmount: 0,
        draftBatches: 0,
        submittedBatches: 0,
        approvedBatches: 0,
      },
    })
  } catch (error) {
    console.error("Error fetching facility batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facility/batches - Create a new batch
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { batchType = "weekly", weekStartDate, weekEndDate, submissionEmails } = body

    // Validate required fields
    if (!weekStartDate || !weekEndDate) {
      return NextResponse.json({ error: "Week start and end dates are required" }, { status: 400 })
    }

    // Get facility information to get TPA ID
    const facility = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, user.facilityId))
      .limit(1)

    if (facility.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    if (!facility[0].tpaId) {
      return NextResponse.json({ error: "Facility is not assigned to a TPA" }, { status: 400 })
    }

    // Generate batch number
    const facilityCode = facility[0].code
    const year = new Date(weekStartDate).getFullYear()
    const week = getWeekNumber(new Date(weekStartDate))
    const batchNumber = `${facilityCode}-${year}-W${week.toString().padStart(2, '0')}`

    // Check if batch already exists for this week
    const existingBatch = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.facilityId, user.facilityId),
          eq(batches.batchNumber, batchNumber)
        )
      )
      .limit(1)

    if (existingBatch.length > 0) {
      return NextResponse.json({ error: "Batch already exists for this week" }, { status: 400 })
    }

    // Create new batch
    const newBatch = await db
      .insert(batches)
      .values({
        batchNumber,
        tpaId: facility[0].tpaId,
        facilityId: user.facilityId,
        batchType,
        weekStartDate,
        weekEndDate,
        submissionEmails: submissionEmails ? JSON.stringify(submissionEmails) : null,
        status: "draft",
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({
      message: "Batch created successfully",
      batch: newBatch[0],
    })
  } catch (error) {
    console.error("Error creating batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}