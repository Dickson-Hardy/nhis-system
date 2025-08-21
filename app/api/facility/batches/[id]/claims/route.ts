import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { batches, claims } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// POST /api/facility/batches/[id]/claims - Add claims to batch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    const batchId = parseInt(params.id)
    if (isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 })
    }

    const body = await request.json()
    const { claimIds, action } = body

    // Check if batch exists and belongs to facility
    const batch = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.id, batchId),
          eq(batches.facilityId, user.facilityId!)
        )
      )
      .limit(1)

    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    if (batch[0].status !== "draft") {
      return NextResponse.json({ error: "Can only modify draft batches" }, { status: 400 })
    }

    if (action === "add") {
      if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
        return NextResponse.json({ error: "Claim IDs are required" }, { status: 400 })
      }

      // Verify all claims belong to this facility and are not already in a batch
      const claimsToAdd = await db
        .select()
        .from(claims)
        .where(
          and(
            eq(claims.facilityId, user.facilityId!),
            isNull(claims.batchId)
          )
        )

      const validClaimIds = claimsToAdd
        .filter(claim => claimIds.includes(claim.id))
        .map(claim => claim.id)

      if (validClaimIds.length === 0) {
        return NextResponse.json({ error: "No valid claims found to add" }, { status: 400 })
      }

      // Add claims to batch
      await db
        .update(claims)
        .set({ 
          batchId, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(claims.facilityId, user.facilityId!),
            isNull(claims.batchId)
          )
        )

      // Update batch with new claim count and total
      const batchStats = await calculateBatchStats(batchId)
      await db
        .update(batches)
        .set({
          totalClaims: batchStats.totalClaims,
          totalAmount: batchStats.totalAmount,
          updatedAt: new Date(),
        })
        .where(eq(batches.id, batchId))

      return NextResponse.json({
        message: `${validClaimIds.length} claims added to batch successfully`,
        addedClaims: validClaimIds.length,
      })
    }

    if (action === "remove") {
      if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
        return NextResponse.json({ error: "Claim IDs are required" }, { status: 400 })
      }

      // Remove claims from batch
      const removedClaims = await db
        .update(claims)
        .set({ 
          batchId: null, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(claims.batchId, batchId),
            eq(claims.facilityId, user.facilityId!)
          )
        )
        .returning()

      // Update batch statistics
      const batchStats = await calculateBatchStats(batchId)
      await db
        .update(batches)
        .set({
          totalClaims: batchStats.totalClaims,
          totalAmount: batchStats.totalAmount,
          updatedAt: new Date(),
        })
        .where(eq(batches.id, batchId))

      return NextResponse.json({
        message: `${removedClaims.length} claims removed from batch successfully`,
        removedClaims: removedClaims.length,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing batch claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/facility/batches/[id]/claims - Get claims in batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    const batchId = parseInt(params.id)
    if (isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 })
    }

    // Check if batch belongs to facility
    const batch = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.id, batchId),
          eq(batches.facilityId, user.facilityId!)
        )
      )
      .limit(1)

    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // Get claims in batch
    const batchClaims = await db
      .select()
      .from(claims)
      .where(eq(claims.batchId, batchId))
      .orderBy(claims.createdAt)

    // Get available claims (not in any batch) for this facility
    const availableClaims = await db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.facilityId, user.facilityId!),
          isNull(claims.batchId),
          eq(claims.status, "completed") // Only completed claims can be batched
        )
      )
      .orderBy(claims.createdAt)

    return NextResponse.json({
      batchClaims,
      availableClaims,
      batchInfo: batch[0],
    })
  } catch (error) {
    console.error("Error fetching batch claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to calculate batch statistics
async function calculateBatchStats(batchId: number) {
  const result = await db
    .select({
      totalClaims: claims.id,
      totalAmount: claims.totalCostOfCare,
    })
    .from(claims)
    .where(eq(claims.batchId, batchId))

  const totalClaims = result.length
  const totalAmount = result.reduce((sum, claim) => {
    return sum + (parseFloat(claim.totalAmount?.toString() || "0"))
  }, 0)

  return {
    totalClaims,
    totalAmount: totalAmount.toFixed(2),
  }
}