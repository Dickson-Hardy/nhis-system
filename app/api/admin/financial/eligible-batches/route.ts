import { NextRequest, NextResponse } from "next/server"
import { eq, desc, and, notInArray, sql, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { batches, tpas, users, reimbursements } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/financial/eligible-batches - Get batches eligible for reimbursement
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
    const tpaId = searchParams.get("tpaId")
    const status = searchParams.get("status") || "all"

    // Build where conditions for eligible batches
    const whereConditions: any[] = []
    
    // Only include batches that are completed/closed and eligible for reimbursement
    whereConditions.push(
      or(
        eq(batches.status, "verified_paid"),
        eq(batches.status, "completed"),
        eq(batches.status, "closed")
      )
    )

    if (tpaId) {
      whereConditions.push(eq(batches.tpaId, parseInt(tpaId)))
    }

    // Get batches that have already been reimbursed to exclude them
    const reimbursedBatchIds = await db
      .select({ batchIds: reimbursements.batchIds })
      .from(reimbursements)
      .where(eq(reimbursements.status, "completed"))

    const alreadyReimbursedBatchIds: number[] = []
    reimbursedBatchIds.forEach(record => {
      if (record.batchIds) {
        try {
          const batchIds = JSON.parse(record.batchIds)
          alreadyReimbursedBatchIds.push(...batchIds)
        } catch (error) {
          console.error("Error parsing batch IDs:", error)
        }
      }
    })

    // Exclude already reimbursed batches
    if (alreadyReimbursedBatchIds.length > 0) {
      whereConditions.push(notInArray(batches.id, alreadyReimbursedBatchIds))
    }

    const whereClause = and(...whereConditions)

    // Fetch eligible batches
    const eligibleBatches = await db
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
      .orderBy(desc(batches.reviewedAt), desc(batches.submittedAt))

    // Group batches by TPA for easier reimbursement management
    const batchesByTpa = eligibleBatches.reduce((acc: any, batch) => {
      const tpaKey = batch.tpaId.toString()
      if (!acc[tpaKey]) {
        acc[tpaKey] = {
          tpa: batch.tpa,
          batches: [],
          totalBatches: 0,
          totalClaims: 0,
          totalAmount: 0,
        }
      }
      acc[tpaKey].batches.push(batch)
      acc[tpaKey].totalBatches += 1
      acc[tpaKey].totalClaims += batch.totalClaims || 0
      acc[tpaKey].totalAmount += parseFloat(batch.totalAmount || '0')
      return acc
    }, {})

    // Get summary statistics
    const stats = {
      totalEligibleBatches: eligibleBatches.length,
      totalAmount: eligibleBatches.reduce((sum, batch) => sum + parseFloat(batch.totalAmount || '0'), 0),
      totalClaims: eligibleBatches.reduce((sum, batch) => sum + (batch.totalClaims || 0), 0),
      tpaCount: Object.keys(batchesByTpa).length,
    }

    return NextResponse.json({
      eligibleBatches,
      batchesByTpa,
      statistics: stats,
    })
  } catch (error) {
    console.error("Error fetching eligible batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/financial/eligible-batches/bulk-reimburse - Create bulk reimbursement for multiple TPAs
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const {
      tpaReimbursements, // Array of { tpaId, batchIds, adminFeePercentage }
      reimbursementDate,
      reimbursementMethod,
      baseReference, // Base reference number, will be appended with sequence
    } = body

    if (!tpaReimbursements || !Array.isArray(tpaReimbursements) || tpaReimbursements.length === 0) {
      return NextResponse.json({ error: "TPA reimbursements data is required" }, { status: 400 })
    }

    if (!reimbursementDate || !reimbursementMethod || !baseReference) {
      return NextResponse.json({ error: "Reimbursement date, method, and base reference are required" }, { status: 400 })
    }

    const createdReimbursements = []
    let sequenceNumber = 1

    for (const tpaReimbursement of tpaReimbursements) {
      const { tpaId, batchIds, adminFeePercentage = 0 } = tpaReimbursement

      // Generate unique reference for this TPA
      const reimbursementReference = `${baseReference}-${sequenceNumber.toString().padStart(3, '0')}`

      // Fetch batch details for this TPA
      const batchesData = await db
        .select({
          id: batches.id,
          batchNumber: batches.batchNumber,
          totalClaims: batches.totalClaims,
          totalAmount: batches.totalAmount,
          status: batches.status,
        })
        .from(batches)
        .where(
          and(
            eq(batches.tpaId, parseInt(tpaId)),
            or(
              eq(batches.status, "verified_paid"),
              eq(batches.status, "completed"),
              eq(batches.status, "closed")
            )
          )
        )

      if (batchesData.length === 0) {
        continue // Skip if no eligible batches found
      }

      // Calculate amounts
      const totalClaimsAmount = batchesData.reduce((sum, batch) => sum + parseFloat(batch.totalAmount || '0'), 0)
      const adminFeeAmount = (totalClaimsAmount * parseFloat(adminFeePercentage.toString())) / 100
      const netReimbursementAmount = totalClaimsAmount - adminFeeAmount

      // Create reimbursement record
      const newReimbursement = await db
        .insert(reimbursements)
        .values({
          tpaId: parseInt(tpaId),
          amount: netReimbursementAmount.toString(),
          reimbursementReference,
          reimbursementDate,
          reimbursementMethod,
          batchIds: JSON.stringify(batchIds),
          totalClaimsAmount: totalClaimsAmount.toString(),
          adminFeePercentage: adminFeePercentage.toString(),
          adminFeeAmount: adminFeeAmount.toString(),
          netReimbursementAmount: netReimbursementAmount.toString(),
          description: `Bulk reimbursement for ${batchesData.length} batches`,
          status: "pending",
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      createdReimbursements.push({
        reimbursement: newReimbursement[0],
        batchDetails: {
          totalBatches: batchesData.length,
          totalClaims: batchesData.reduce((sum, batch) => sum + (batch.totalClaims || 0), 0),
          totalClaimsAmount,
          adminFeeAmount,
          netReimbursementAmount,
        },
      })

      sequenceNumber++
    }

    return NextResponse.json({
      message: `Bulk reimbursement created successfully for ${createdReimbursements.length} TPAs`,
      reimbursements: createdReimbursements,
      summary: {
        totalTPAs: createdReimbursements.length,
        totalAmount: createdReimbursements.reduce((sum, r) => sum + parseFloat(r.reimbursement.amount), 0),
      },
    })
  } catch (error) {
    console.error("Error creating bulk reimbursement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}