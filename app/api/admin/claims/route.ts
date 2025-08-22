import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, tpas, facilities, users } from "@/lib/db/schema"
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

    console.log("Admin claims API: Starting request processing")

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const status = searchParams.get("status") // Removed default filter
    const decision = searchParams.get("decision")
    const tpaId = searchParams.get("tpaId")
    const facilityId = searchParams.get("facilityId")
    const batchNumber = searchParams.get("batchNumber")

    const offset = (page - 1) * limit

    console.log("Query parameters:", { page, limit, search, status, decision, tpaId, facilityId, batchNumber })

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

    console.log("Where conditions count:", whereConditions.length)

    try {
      // Fetch claims with related data
      console.log("Fetching claims data...")
      
      // Define the select object - ensure all fields exist in schema
      const selectObject = {
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
      }
      
      // Validate that all schema references are defined
      console.log("Validating schema references...")
      console.log("Claims table fields:", Object.keys(claims))
      console.log("TPAs table fields:", Object.keys(tpas))
      console.log("Facilities table fields:", Object.keys(facilities))
      
      console.log("Select object keys:", Object.keys(selectObject))
      
      // Try a simpler query first to isolate the issue
      console.log("Building query with simplified select...")
      let query = db
        .select({
          id: claims.id,
          uniqueClaimId: claims.uniqueClaimId,
          beneficiaryName: claims.beneficiaryName,
          status: claims.status,
          decision: claims.decision,
          totalCostOfCare: claims.totalCostOfCare,
          dateOfClaimSubmission: claims.dateOfClaimSubmission,
        })
        .from(claims)
        .orderBy(desc(claims.dateOfClaimSubmission))
        .limit(limit)
        .offset(offset)
        
      // Apply where clause if conditions exist
      if (whereClause) {
        query = query.where(whereClause)
      }

      console.log("Query constructed, executing...")
      
      let claimsData
      try {
        claimsData = await query
        console.log("Claims data fetched, count:", claimsData?.length || 0)
      } catch (queryError) {
        console.error("Query execution error:", queryError)
        console.error("Query error stack:", queryError instanceof Error ? queryError.stack : 'No stack trace')
        throw queryError
      }

      // Get total count
      console.log("Fetching total count...")
      let countQuery = db.select({ count: count() }).from(claims)
      if (whereClause) {
        countQuery = countQuery.where(whereClause)
      }
      const totalCountResult = await countQuery
      const totalCount = totalCountResult[0]?.count || 0
      console.log("Total count:", totalCount)
      
      // For now, skip the complex statistics query to isolate the issue
      console.log("Skipping statistics query for debugging...")
      const claimsStats = {
        totalClaims: totalCount,
        submittedClaims: 0,
        awaitingVerification: 0,
        verifiedClaims: 0,
        closedClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        pendingDecision: 0,
        totalAmount: 0,
        approvedAmount: 0,
      }

      // Statistics query removed for debugging - using simplified stats above

      const response = {
        claims: claimsData || [],
        statistics: claimsStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      }

      console.log("Sending response with claims count:", response.claims.length)
      return NextResponse.json(response)

    } catch (dbError) {
      console.error("Database error:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("Error in admin claims API:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("Error message:", error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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