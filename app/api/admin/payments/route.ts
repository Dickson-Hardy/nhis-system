import { type NextRequest, NextResponse } from "next/server"
import { db, claims, batches, tpas, facilities } from "@/lib/db"
import { eq, desc, ilike, count, and, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/payments - Fetch payment data (Admin only)
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
    
    // Only show approved claims that are eligible for payment
    whereConditions.push(eq(claims.decision, "approved"))
    
    if (search) {
      whereConditions.push(ilike(claims.uniqueClaimId, `%${search}%`))
    }
    
    if (status) {
      whereConditions.push(eq(claims.status, status))
    }
    
    if (tpaId) {
      whereConditions.push(eq(claims.tpaId, parseInt(tpaId)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch payment-eligible claims
    const paymentsData = await db
      .select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        beneficiaryName: claims.beneficiaryName,
        totalCostOfCare: claims.totalCostOfCare,
        approvedCostOfCare: claims.approvedCostOfCare,
        status: claims.status,
        dateOfClaimsPayment: claims.dateOfClaimsPayment,
        batchNumber: claims.batchNumber,
        dateOfClaimSubmission: claims.dateOfClaimSubmission,
        primaryDiagnosis: claims.primaryDiagnosis,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
        },
      })
      .from(claims)
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .where(whereClause)
      .orderBy(desc(claims.dateOfClaimSubmission))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCount = await db.select({ count: count() }).from(claims).where(whereClause)

    // Get payment statistics
    const paymentStats = await db
      .select({
        totalPending: sql<number>`count(case when ${claims.status} = 'verified_awaiting_payment' then 1 end)`,
        totalPaid: sql<number>`count(case when ${claims.status} = 'verified_paid' then 1 end)`,
        totalPendingAmount: sql<number>`sum(case when ${claims.status} = 'verified_awaiting_payment' then ${claims.approvedCostOfCare} else 0 end)`,
        totalPaidAmount: sql<number>`sum(case when ${claims.status} = 'verified_paid' then ${claims.approvedCostOfCare} else 0 end)`,
      })
      .from(claims)
      .where(eq(claims.decision, "approved"))

    return NextResponse.json({
      payments: paymentsData,
      statistics: paymentStats[0],
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/payments - Process payment (Admin only)
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
    const { claimIds, action } = body

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json({ error: "Claim IDs are required" }, { status: 400 })
    }

    if (action !== "approve_payment" && action !== "reject_payment") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update claim statuses based on action
    const newStatus = action === "approve_payment" ? "verified_paid" : "not_verified"
    const paymentDate = action === "approve_payment" ? new Date() : null

    const updatedClaims = await db
      .update(claims)
      .set({
        status: newStatus,
        dateOfClaimsPayment: paymentDate,
        updatedAt: new Date(),
      })
      .where(sql`${claims.id} = ANY(${claimIds})`)
      .returning()

    return NextResponse.json({ 
      message: `${updatedClaims.length} claims ${action === "approve_payment" ? "paid" : "rejected"} successfully`,
      updatedClaims: updatedClaims.length 
    })
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}