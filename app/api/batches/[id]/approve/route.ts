import { type NextRequest, NextResponse } from "next/server"
import { db, batches, claims } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

// PUT /api/batches/[id]/approve - Approve batch
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const batchId = Number.parseInt(params.id)
    const { remarks } = await request.json()

    const batch = await db.select().from(batches).where(eq(batches.id, batchId))
    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    if (batch[0].status !== "submitted") {
      return NextResponse.json({ error: "Batch not in submitted status" }, { status: 400 })
    }

    // Update batch status
    const updatedBatch = await db
      .update(batches)
      .set({
        status: "approved",
        reviewedAt: new Date(),
      })
      .where(eq(batches.id, batchId))
      .returning()

    // Update all claims in batch to approved
    await db
      .update(claims)
      .set({
        status: "approved",
        decision: "approved",
        updatedAt: new Date(),
      })
      .where(eq(claims.batchNumber, batch[0].batchNumber))

    // Send notification to TPA
    await sendNotification({
      type: "batch_approved",
      recipientEmail: "tpa@example.com", // This should come from TPA details
      data: {
        batchNumber: batch[0].batchNumber,
        totalAmount: batch[0].totalAmount,
        remarks,
      },
    })

    return NextResponse.json({
      message: "Batch approved successfully",
      batch: updatedBatch[0],
    })
  } catch (error) {
    console.error("Error approving batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
