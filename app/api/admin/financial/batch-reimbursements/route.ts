import { NextRequest, NextResponse } from "next/server"
import { eq, desc, and, ilike, count, sql, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { batches, tpas, users, claims, reimbursements } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/financial/eligible-batches - Fetch batches eligible for reimbursement
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const tpaId = searchParams.get("tpaId")
    const status = searchParams.get("status") || "closed" // Default to closed batches for admin review

    const offset = (page - 1) * limit

    // Build where conditions - show batches based on status (default: closed for admin review)
    const whereConditions: any[] = [
      eq(batches.status, status) // closed means TPA has completed processing and submitted to admin
    ]
    
    if (search) {
      whereConditions.push(
        ilike(batches.batchNumber, `%${search}%`)
      )
    }
    
    if (tpaId) {
      whereConditions.push(eq(batches.tpaId, parseInt(tpaId)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get batches with detailed information
    const batchesData = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        tpaId: batches.tpaId,
        totalClaims: batches.totalClaims,
        totalAmount: batches.totalAmount,
        status: batches.status,
        submittedAt: batches.submittedAt,
        reviewedAt: batches.reviewedAt,
        createdAt: batches.createdAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .leftJoin(users, eq(batches.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(batches.reviewedAt))
      .limit(limit)
      .offset(offset)

    // Get batch IDs to check for existing reimbursements
    const batchIds = batchesData.map(batch => batch.id)
    
    // Check which batches have already been reimbursed
    let reimbursedBatchIds: number[] = []
    if (batchIds.length > 0) {
      const existingReimbursements = await db
        .select({
          batchIds: reimbursements.batchIds,
        })
        .from(reimbursements)
        .where(eq(reimbursements.status, "completed"))

      // Parse batch IDs from JSON and flatten
      reimbursedBatchIds = existingReimbursements
        .flatMap(r => JSON.parse(r.batchIds || '[]'))
        .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates
    }

    // Add reimbursement status to each batch
    const batchesWithStatus = batchesData.map(batch => ({
      ...batch,
      isReimbursed: reimbursedBatchIds.includes(batch.id),
      eligibleForReimbursement: !reimbursedBatchIds.includes(batch.id) && batch.status === 'verified_paid'
    }))

    // Get detailed claims information for each batch
    const batchesWithClaims = await Promise.all(
      batchesWithStatus.map(async (batch) => {
        const batchClaims = await db
          .select({
            totalApprovedAmount: sql<number>`sum(${claims.approvedCostOfCare})`,
            totalClaimsAmount: sql<number>`sum(${claims.totalCostOfCare})`,
            approvedClaims: sql<number>`count(case when ${claims.decision} = 'approved' then 1 end)`,
            rejectedClaims: sql<number>`count(case when ${claims.decision} = 'rejected' then 1 end)`,
            pendingClaims: sql<number>`count(case when ${claims.decision} is null or ${claims.decision} = 'pending' then 1 end)`,
          })
          .from(claims)
          .where(eq(claims.batchNumber, batch.batchNumber))

        return {
          ...batch,
          claimsSummary: batchClaims[0],
          reimbursableAmount: batchClaims[0]?.totalApprovedAmount || 0,
        }
      })
    )

    // Get total count
    const totalCount = await db.select({ count: count() }).from(batches).where(whereClause)

    // Get statistics
    const stats = await db
      .select({
        totalEligibleBatches: sql<number>`count(*)`,
        totalEligibleAmount: sql<number>`sum(${batches.totalAmount})`,
        totalReimbursedBatches: sql<number>`0`, // Will calculate separately
        totalReimbursedAmount: sql<number>`0`, // Will calculate separately
      })
      .from(batches)
      .where(whereClause)

    // Get reimbursement statistics
    const reimbursementStats = await db
      .select({
        totalReimbursements: sql<number>`count(*)`,
        totalReimbursedAmount: sql<number>`sum(${reimbursements.amount})`,
        pendingReimbursements: sql<number>`count(case when ${reimbursements.status} = 'pending' then 1 end)`,
        completedReimbursements: sql<number>`count(case when ${reimbursements.status} = 'completed' then 1 end)`,
      })
      .from(reimbursements)

    return NextResponse.json({
      batches: batchesWithClaims,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
      statistics: {
        ...stats[0],
        ...reimbursementStats[0],
      },
    })
  } catch (error) {
    console.error("Error fetching eligible batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}