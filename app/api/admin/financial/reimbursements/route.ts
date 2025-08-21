import { NextRequest, NextResponse } from "next/server"
import { eq, desc, and, ilike, count, sql, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { reimbursements, tpas, users, batches, claims } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/financial/reimbursements - Fetch batch reimbursements
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
    const status = searchParams.get("status")
    const tpaId = searchParams.get("tpaId")

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []
    
    if (search) {
      whereConditions.push(
        ilike(reimbursements.reimbursementReference, `%${search}%`)
      )
    }
    
    if (status) {
      whereConditions.push(eq(reimbursements.status, status))
    }
    
    if (tpaId) {
      whereConditions.push(eq(reimbursements.tpaId, parseInt(tpaId)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch reimbursements with TPA and user details
    const reimbursementsData = await db
      .select({
        id: reimbursements.id,
        tpaId: reimbursements.tpaId,
        amount: reimbursements.amount,
        reimbursementReference: reimbursements.reimbursementReference,
        reimbursementDate: reimbursements.reimbursementDate,
        reimbursementMethod: reimbursements.reimbursementMethod,
        batchIds: reimbursements.batchIds,
        reimbursementType: reimbursements.reimbursementType,
        periodStart: reimbursements.periodStart,
        periodEnd: reimbursements.periodEnd,
        totalClaimsAmount: reimbursements.totalClaimsAmount,
        adminFeePercentage: reimbursements.adminFeePercentage,
        adminFeeAmount: reimbursements.adminFeeAmount,
        netReimbursementAmount: reimbursements.netReimbursementAmount,
        receiptUrl: reimbursements.receiptUrl,
        receiptFileName: reimbursements.receiptFileName,
        status: reimbursements.status,
        processedAt: reimbursements.processedAt,
        description: reimbursements.description,
        processingNotes: reimbursements.processingNotes,
        createdAt: reimbursements.createdAt,
        updatedAt: reimbursements.updatedAt,
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
      .from(reimbursements)
      .leftJoin(tpas, eq(reimbursements.tpaId, tpas.id))
      .leftJoin(users, eq(reimbursements.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(reimbursements.createdAt))
      .limit(limit)
      .offset(offset)

    // Add batch details to each reimbursement
    const reimbursementsWithBatches = await Promise.all(
      reimbursementsData.map(async (reimbursement) => {
        const batchIds = JSON.parse(reimbursement.batchIds || '[]')
        
        if (batchIds.length > 0) {
          const batchDetails = await db
            .select({
              id: batches.id,
              batchNumber: batches.batchNumber,
              totalClaims: batches.totalClaims,
              totalAmount: batches.totalAmount,
              status: batches.status,
            })
            .from(batches)
            .where(inArray(batches.id, batchIds))

          return {
            ...reimbursement,
            batches: batchDetails,
            batchCount: batchDetails.length,
          }
        }

        return {
          ...reimbursement,
          batches: [],
          batchCount: 0,
        }
      })
    )

    // Get total count
    const totalCount = await db.select({ count: count() }).from(reimbursements).where(whereClause)

    // Get statistics
    const stats = await db
      .select({
        totalReimbursements: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${reimbursements.amount})`,
        pendingReimbursements: sql<number>`count(case when ${reimbursements.status} = 'pending' then 1 end)`,
        processedReimbursements: sql<number>`count(case when ${reimbursements.status} = 'processed' then 1 end)`,
        completedReimbursements: sql<number>`count(case when ${reimbursements.status} = 'completed' then 1 end)`,
        pendingAmount: sql<number>`sum(case when ${reimbursements.status} = 'pending' then ${reimbursements.amount} else 0 end)`,
        processedAmount: sql<number>`sum(case when ${reimbursements.status} = 'processed' then ${reimbursements.amount} else 0 end)`,
        completedAmount: sql<number>`sum(case when ${reimbursements.status} = 'completed' then ${reimbursements.amount} else 0 end)`,
      })
      .from(reimbursements)
      .where(whereClause)

    return NextResponse.json({
      reimbursements: reimbursementsWithBatches,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
      statistics: stats[0],
    })
  } catch (error) {
    console.error("Error fetching reimbursements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/financial/reimbursements - Create new batch reimbursement
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
      tpaId,
      batchIds, // Array of batch IDs to reimburse
      reimbursementReference,
      reimbursementDate,
      reimbursementMethod,
      reimbursementType = "batch", // 'batch' or 'bulk_batch'
      periodStart,
      periodEnd,
      adminFeePercentage = 0,
      description,
      status = "pending"
    } = body

    // Validate required fields
    if (!tpaId || !batchIds || !Array.isArray(batchIds) || batchIds.length === 0 || !reimbursementReference || !reimbursementDate || !reimbursementMethod) {
      return NextResponse.json(
        { error: "TPA, batch IDs, reference, date, and method are required" },
        { status: 400 }
      )
    }

    // Check if reimbursement reference already exists
    const existingReimbursement = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.reimbursementReference, reimbursementReference))
      .limit(1)

    if (existingReimbursement.length > 0) {
      return NextResponse.json(
        { error: "Reimbursement reference already exists" },
        { status: 400 }
      )
    }

    // Verify all batches exist and belong to the TPA
    const batchesToReimburse = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        tpaId: batches.tpaId,
        totalAmount: batches.totalAmount,
        status: batches.status,
      })
      .from(batches)
      .where(and(
        inArray(batches.id, batchIds),
        eq(batches.tpaId, parseInt(tpaId)),
        eq(batches.status, "verified_paid") // Only reimburse paid batches
      ))

    if (batchesToReimburse.length !== batchIds.length) {
      return NextResponse.json(
        { error: "Some batches not found, don't belong to TPA, or are not eligible for reimbursement" },
        { status: 400 }
      )
    }

    // Check if any batch is already reimbursed
    const existingReimbursements = await db
      .select({ batchIds: reimbursements.batchIds })
      .from(reimbursements)
      .where(eq(reimbursements.status, "completed"))

    const alreadyReimbursedIds = existingReimbursements
      .flatMap(r => JSON.parse(r.batchIds || '[]'))
      .filter((id, index, self) => self.indexOf(id) === index)

    const conflictingBatches = batchIds.filter(id => alreadyReimbursedIds.includes(id))
    if (conflictingBatches.length > 0) {
      return NextResponse.json(
        { error: `Batches already reimbursed: ${conflictingBatches.join(', ')}` },
        { status: 400 }
      )
    }

    // Calculate amounts from approved claims in these batches
    const claimsTotal = await db
      .select({
        totalClaimsAmount: sql<number>`sum(${claims.totalCostOfCare})`,
        totalApprovedAmount: sql<number>`sum(${claims.approvedCostOfCare})`,
        totalClaims: sql<number>`count(*)`,
        approvedClaims: sql<number>`count(case when ${claims.decision} = 'approved' then 1 end)`,
      })
      .from(claims)
      .where(
        inArray(claims.batchNumber, batchesToReimburse.map(b => b.batchNumber))
      )

    const totalApprovedAmount = claimsTotal[0]?.totalApprovedAmount || 0
    const adminFeeAmount = (totalApprovedAmount * (adminFeePercentage / 100))
    const netReimbursementAmount = totalApprovedAmount - adminFeeAmount

    // Create reimbursement
    const newReimbursement = await db
      .insert(reimbursements)
      .values({
        tpaId: parseInt(tpaId),
        amount: netReimbursementAmount.toString(),
        reimbursementReference,
        reimbursementDate,
        reimbursementMethod,
        batchIds: JSON.stringify(batchIds),
        reimbursementType,
        periodStart,
        periodEnd,
        totalClaimsAmount: claimsTotal[0]?.totalClaimsAmount?.toString() || "0",
        adminFeePercentage: adminFeePercentage.toString(),
        adminFeeAmount: adminFeeAmount.toString(),
        netReimbursementAmount: netReimbursementAmount.toString(),
        description,
        status,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Get TPA details for response
    const tpaDetails = await db
      .select({ name: tpas.name, code: tpas.code })
      .from(tpas)
      .where(eq(tpas.id, parseInt(tpaId)))
      .limit(1)

    return NextResponse.json({
      message: "Batch reimbursement created successfully",
      reimbursement: {
        ...newReimbursement[0],
        tpa: tpaDetails[0],
        batches: batchesToReimburse,
        claimsSummary: claimsTotal[0],
      },
    })
  } catch (error) {
    console.error("Error creating batch reimbursement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}