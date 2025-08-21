import { type NextRequest, NextResponse } from "next/server"
import { db, claims, tpas, facilities, users } from "@/lib/db"
import { eq, desc, ilike, count, and, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/claims - Fetch all claims for admin review
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
    const status = searchParams.get("status") || "closed" // Default to closed claims for admin review
    const decision = searchParams.get("decision")
    const tpaId = searchParams.get("tpaId")
    const facilityId = searchParams.get("facilityId")
    const batchNumber = searchParams.get("batchNumber")

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []
    
    if (search) {
      whereConditions.push(ilike(claims.uniqueClaimId, `%${search}%`))
    }
    
    if (status) {
      whereConditions.push(eq(claims.status, status))
    }
    
    if (decision) {
      whereConditions.push(eq(claims.decision, decision))
    }
    
    if (tpaId) {
      whereConditions.push(eq(claims.tpaId, parseInt(tpaId)))
    }
    
    if (facilityId) {
      whereConditions.push(eq(claims.facilityId, parseInt(facilityId)))
    }
    
    if (batchNumber) {
      whereConditions.push(eq(claims.batchNumber, batchNumber))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch claims with related data
    const claimsData = await db
      .select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        beneficiaryName: claims.beneficiaryName,
        dateOfBirth: claims.dateOfBirth,
        age: claims.age,
        address: claims.address,
        phoneNumber: claims.phoneNumber,
        nin: claims.nin,
        primaryDiagnosis: claims.primaryDiagnosis,
        secondaryDiagnosis: claims.secondaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        totalCostOfCare: claims.totalCostOfCare,
        approvedCostOfCare: claims.approvedCostOfCare,
        costOfInvestigation: claims.costOfInvestigation,
        costOfProcedure: claims.costOfProcedure,
        costOfMedication: claims.costOfMedication,
        costOfOtherServices: claims.costOfOtherServices,
        status: claims.status,
        decision: claims.decision,
        reasonForRejection: claims.reasonForRejection,
        rejectionReason: claims.rejectionReason,
        dateOfAdmission: claims.dateOfAdmission,
        dateOfDischarge: claims.dateOfDischarge,
        dateOfTreatment: claims.dateOfTreatment,
        dateOfClaimSubmission: claims.dateOfClaimSubmission,
        dateOfClaimsPayment: claims.dateOfClaimsPayment,
        hospitalNumber: claims.hospitalNumber,
        batchNumber: claims.batchNumber,
        tpaRemarks: claims.tpaRemarks,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
          state: facilities.state,
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

    // Get claims statistics
    const claimsStats = await db
      .select({
        totalClaims: sql<number>`count(*)`,
        submittedClaims: sql<number>`count(case when ${claims.status} = 'submitted' then 1 end)`,
        awaitingVerification: sql<number>`count(case when ${claims.status} = 'awaiting_verification' then 1 end)`,
        verifiedClaims: sql<number>`count(case when ${claims.status} = 'verified' then 1 end)`,
        closedClaims: sql<number>`count(case when ${claims.status} = 'closed' then 1 end)`,
        approvedClaims: sql<number>`count(case when ${claims.decision} = 'approved' then 1 end)`,
        rejectedClaims: sql<number>`count(case when ${claims.decision} = 'rejected' then 1 end)`,
        pendingDecision: sql<number>`count(case when ${claims.decision} is null then 1 end)`,
        totalAmount: sql<number>`sum(${claims.totalCostOfCare})`,
        approvedAmount: sql<number>`sum(${claims.approvedCostOfCare})`,
      })
      .from(claims)

    return NextResponse.json({
      claims: claimsData,
      statistics: claimsStats[0],
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/claims - Update claim status/decision (Admin only)
export async function PUT(request: NextRequest) {
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
    const { claimIds, action, decision, reasonForRejection, approvedAmount } = body

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json({ error: "Claim IDs are required" }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    let updateData: any = {
      updatedAt: new Date(),
    }

    switch (action) {
      case "verify":
        updateData.status = "verified"
        break
      case "approve":
        if (!decision) {
          return NextResponse.json({ error: "Decision is required for approval" }, { status: 400 })
        }
        updateData.decision = decision
        updateData.status = decision === "approved" ? "verified_awaiting_payment" : "not_verified"
        if (decision === "approved" && approvedAmount) {
          updateData.approvedCostOfCare = approvedAmount
        }
        if (decision === "rejected" && reasonForRejection) {
          updateData.reasonForRejection = reasonForRejection
        }
        break
      case "reject_verification":
        updateData.status = "not_verified"
        if (reasonForRejection) {
          updateData.reasonForRejection = reasonForRejection
        }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedClaims = await db
      .update(claims)
      .set(updateData)
      .where(sql`${claims.id} = ANY(${claimIds})`)
      .returning()

    return NextResponse.json({ 
      message: `${updatedClaims.length} claims updated successfully`,
      updatedClaims: updatedClaims.length 
    })
  } catch (error) {
    console.error("Error updating claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}