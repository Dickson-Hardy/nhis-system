import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { claims, facilities, batches } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/facility/claims - Get all claims for the facility
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
    const batchStatus = url.searchParams.get("batchStatus") // "unassigned", "assigned"
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    // Build query conditions
    const conditions = [eq(claims.facilityId, user.facilityId)]

    if (status) {
      conditions.push(eq(claims.status, status))
    }

    if (batchStatus === "unassigned") {
      conditions.push(isNull(claims.batchId))
    } else if (batchStatus === "assigned") {
      conditions.push(isNotNull(claims.batchId))
    }

    // Get claims with batch information
    const facilityClaims = await db
      .select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        beneficiaryName: claims.beneficiaryName,
        hospitalNumber: claims.hospitalNumber,
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        dateOfAdmission: claims.dateOfAdmission,
        dateOfTreatment: claims.dateOfTreatment,
        dateOfDischarge: claims.dateOfDischarge,
        primaryDiagnosis: claims.primaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        totalCostOfCare: claims.totalCostOfCare,
        status: claims.status,
        batchId: claims.batchId,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        batch: {
          id: batches.id,
          batchNumber: batches.batchNumber,
          status: batches.status,
        }
      })
      .from(claims)
      .leftJoin(batches, eq(claims.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      claims: facilityClaims,
      pagination: {
        limit,
        offset,
        hasMore: facilityClaims.length === limit,
      },
    })
  } catch (error) {
    console.error("Error fetching facility claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facility/claims - Create a new claim (discharge form)
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
    const {
      // Patient Information
      uniqueBeneficiaryId,
      hospitalNumber,
      beneficiaryName,
      dateOfBirth,
      age,
      address,
      phoneNumber,
      nin,
      
      // Treatment Information
      dateOfAdmission,
      dateOfTreatment,
      dateOfDischarge,
      primaryDiagnosis,
      secondaryDiagnosis,
      treatmentProcedure,
      quantity,
      
      // Cost Information
      costOfInvestigation,
      costOfProcedure,
      costOfMedication,
      costOfOtherServices,
      
      // Batch Assignment (optional)
      batchId,
      
      // Status
      status = "draft", // "draft", "completed"
    } = body

    // Validate required fields
    const requiredFields = {
      uniqueBeneficiaryId: uniqueBeneficiaryId || null,
      hospitalNumber: hospitalNumber || null,
      beneficiaryName: beneficiaryName || null,
      dateOfBirth: dateOfBirth || null,
      age: age || null,
      phoneNumber: phoneNumber || null,
      dateOfAdmission: dateOfAdmission || null,
      dateOfTreatment: dateOfTreatment || null,
      dateOfDischarge: dateOfDischarge || null,
      primaryDiagnosis: primaryDiagnosis || null,
      treatmentProcedure: treatmentProcedure || null,
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(", ")}` 
      }, { status: 400 })
    }

    // Calculate total cost
    const investigation = parseFloat(costOfInvestigation) || 0
    const procedure = parseFloat(costOfProcedure) || 0
    const medication = parseFloat(costOfMedication) || 0
    const otherServices = parseFloat(costOfOtherServices) || 0
    const totalCostOfCare = investigation + procedure + medication + otherServices

    // Get facility information
    const facility = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, user.facilityId))
      .limit(1)

    if (facility.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    // Generate unique claim ID
    const facilityCode = facility[0].code
    const year = new Date().getFullYear()
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    const uniqueClaimId = `${facilityCode}-${year}${month}-${timestamp}`

    // If batchId is provided, validate it belongs to this facility
    if (batchId) {
      const batch = await db
        .select()
        .from(batches)
        .where(
          and(
            eq(batches.id, batchId),
            eq(batches.facilityId, user.facilityId),
            eq(batches.status, "draft")
          )
        )
        .limit(1)

      if (batch.length === 0) {
        return NextResponse.json({ error: "Invalid batch or batch is not in draft status" }, { status: 400 })
      }
    }

    // Create new claim
    const newClaim = await db
      .insert(claims)
      .values({
        uniqueClaimId,
        facilityId: user.facilityId,
        tpaId: facility[0].tpaId!,
        batchId: batchId || null,
        
        // Patient Information
        uniqueBeneficiaryId,
        hospitalNumber,
        beneficiaryName,
        dateOfBirth,
        age: parseInt(age),
        address,
        phoneNumber,
        nin,
        
        // Treatment Information
        dateOfAdmission,
        dateOfTreatment,
        dateOfDischarge,
        primaryDiagnosis,
        secondaryDiagnosis,
        treatmentProcedure,
        quantity: quantity ? parseInt(quantity) : null,
        
        // Cost Information
        costOfInvestigation: investigation.toString(),
        costOfProcedure: procedure.toString(),
        costOfMedication: medication.toString(),
        costOfOtherServices: otherServices.toString(),
        totalCostOfCare: totalCostOfCare.toString(),
        
        status,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // If claim was added to a batch, update batch statistics
    if (batchId) {
      await updateBatchStatistics(batchId)
    }

    return NextResponse.json({
      message: "Claim created successfully",
      claim: newClaim[0],
    })
  } catch (error) {
    console.error("Error creating claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to update batch statistics
async function updateBatchStatistics(batchId: number) {
  const batchClaims = await db
    .select({
      totalCostOfCare: claims.totalCostOfCare,
      status: claims.status,
    })
    .from(claims)
    .where(eq(claims.batchId, batchId))

  const totalClaims = batchClaims.length
  const completedClaims = batchClaims.filter(claim => claim.status === "completed").length
  const totalAmount = batchClaims.reduce((sum, claim) => {
    return sum + parseFloat(claim.totalCostOfCare || "0")
  }, 0)

  await db
    .update(batches)
    .set({
      totalClaims,
      completedClaims,
      totalAmount: totalAmount.toString(),
      updatedAt: new Date(),
    })
    .where(eq(batches.id, batchId))
}