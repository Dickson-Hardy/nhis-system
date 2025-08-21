import { type NextRequest, NextResponse } from "next/server"
import { db, batches, claims } from "@/lib/db"
import { eq, count, sum } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

// POST /api/batches/[id]/submit - Submit batch for review
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "tpa") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = await params
    const batchId = Number.parseInt(id)

    // Get batch details
    const batch = await db.select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      tpaId: batches.tpaId,
      status: batches.status,
      totalClaims: batches.totalClaims,
      totalAmount: batches.totalAmount
    }).from(batches).where(eq(batches.id, batchId))
    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    if (batch[0].status !== "draft") {
      return NextResponse.json({ error: "Batch already submitted" }, { status: 400 })
    }

    // Verify batch has claims
    const claimCount = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.batchNumber, batch[0].batchNumber))

    if (claimCount[0].count === 0) {
      return NextResponse.json({ error: "Cannot submit empty batch" }, { status: 400 })
    }

    // Update batch status and recalculate totals
    const totals = await db
      .select({
        totalClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
      })
      .from(claims)
      .where(eq(claims.batchNumber, batch[0].batchNumber))

    const updatedBatch = await db
      .update(batches)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        totalClaims: totals[0].totalClaims,
        totalAmount: totals[0].totalAmount || "0",
      })
      .where(eq(batches.id, batchId))
      .returning({
        id: batches.id,
        batchNumber: batches.batchNumber,
        tpaId: batches.tpaId,
        status: batches.status,
        totalClaims: batches.totalClaims,
        totalAmount: batches.totalAmount,
        submittedAt: batches.submittedAt
      })

    // Send notification to NHIS admin
    await sendNotification({
      type: "batch_submitted",
      recipientEmail: "admin@nhis.gov.ng", // This should come from settings
      data: {
        batchNumber: batch[0].batchNumber,
        tpaName: user.name,
        totalClaims: totals[0].totalClaims,
        totalAmount: totals[0].totalAmount,
      },
    })

    return NextResponse.json({
      message: "Batch submitted successfully",
      batch: updatedBatch[0],
    })
  } catch (error) {
    console.error("Error submitting batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
