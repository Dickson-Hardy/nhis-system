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

    console.log(`Fetching claims for facility ${user.facilityId}, batchStatus: ${batchStatus}`)

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

    console.log(`Query conditions: ${conditions.length} conditions`)

    // Get claims with batch information
    const facilityClaims = await db
      .select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        beneficiaryName: claims.beneficiaryName,
        hospitalNumber: claims.hospitalNumber,
        dateOfAdmission: claims.dateOfAdmission,
        dateOfDischarge: claims.dateOfDischarge,
        primaryDiagnosis: claims.primaryDiagnosis,
        secondaryDiagnosis: claims.secondaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        treatmentProcedures: claims.treatmentProcedures,
        procedureCost: claims.procedureCost,
        treatmentCost: claims.treatmentCost,
        medicationCost: claims.medicationCost,
        otherCost: claims.otherCost,
        totalCostOfCare: claims.totalCostOfCare,
        quantity: claims.quantity,
        costOfInvestigation: claims.costOfInvestigation,
        costOfProcedure: claims.costOfProcedure,
        costOfMedication: claims.costOfMedication,
        costOfOtherServices: claims.costOfOtherServices,
        status: claims.status,
        batchId: claims.batchId,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        batchInfo: {
          id: batches.id,
          batchNumber: batches.batchNumber,
          status: batches.status,
          createdAt: batches.createdAt
        }
      })
      .from(claims)
      .leftJoin(batches, eq(claims.batchId, batches.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset)

    console.log(`Found ${facilityClaims?.length || 0} claims`)

    // Process the claims to ensure proper structure
    const validClaims = Array.isArray(facilityClaims) ? facilityClaims.map(claim => ({
      ...claim,
      batch: claim.batchInfo?.id ? claim.batchInfo : null,
      treatmentProcedures: claim.treatmentProcedures ? JSON.parse(claim.treatmentProcedures) : null
    })) : []

    // Remove the temporary batchInfo field
    validClaims.forEach(claim => {
      delete (claim as any).batchInfo
    })

    return NextResponse.json({
      claims: validClaims,
      pagination: {
        limit,
        offset,
        hasMore: validClaims.length === limit,
      },
    })
  } catch (error) {
    console.error("Error fetching facility claims:", error)
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : "No stack trace"
    console.error("Error details:", { message: errorMessage, stack: errorStack })
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    }, { status: 500 })
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
    
    // Validate that body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // POST method update
    const {
      uniqueBeneficiaryId,
      hospitalNumber,
      beneficiaryName,
      dateOfBirth,
      age,
      address,
      phoneNumber,
      nin,
      dateOfAdmission,
      dateOfDischarge,
      primaryDiagnosis,
      secondaryDiagnosis,
      procedureCost,
      treatmentCost,
      medicationCost,
      otherCost,
      quantity,
      costOfInvestigation,
      costOfProcedure,
      costOfMedication,
      costOfOtherServices,
      totalCostOfCare,
      batchId,
      status
    } = body

    // Calculate total cost to include all cost categories
    const investigation = parseFloat(costOfInvestigation) || 0
    const procedure = parseFloat(costOfProcedure) || 0
    const medication = parseFloat(costOfMedication) || 0
    const otherServices = parseFloat(costOfOtherServices) || 0
    const procedureCostValue = parseFloat(procedureCost) || 0
    const treatmentCostValue = parseFloat(treatmentCost) || 0
    const medicationCostValue = parseFloat(medicationCost) || 0
    const otherCostValue = parseFloat(otherCost) || 0
    
    const calculatedTotalCost = investigation + procedure + medication + otherServices + 
                              procedureCostValue + treatmentCostValue + medicationCostValue + otherCostValue

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

    const missingFields = Object.entries(requiredFields || {})
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(", ")}` 
      }, { status: 400 })
    }

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

    // Insert new claim
    const newClaim = await db
      .insert(claims)
      .values({
        uniqueBeneficiaryId,
        hospitalNumber,
        beneficiaryName,
        dateOfBirth,
        age,
        address,
        phoneNumber,
        nin,
        dateOfAdmission,
        dateOfDischarge,
        primaryDiagnosis,
        secondaryDiagnosis,
        procedureCost: procedureCostValue,
        treatmentCost: treatmentCostValue,
        medicationCost: medicationCostValue,
        otherCost: otherCostValue,
        quantity: quantity ? parseInt(quantity) : null,
        costOfInvestigation: investigation,
        costOfProcedure: procedure,
        costOfMedication: medication,
        costOfOtherServices: otherServices,
        totalCostOfCare: calculatedTotalCost,
        batchId: parseInt(batchId),
        status: status || 'submitted',
        createdAt: new Date(),
        updatedAt: new Date()
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
  try {
    const batchClaims = await db
      .select({
        totalCostOfCare: claims.totalCostOfCare,
        status: claims.status,
      })
      .from(claims)
      .where(eq(claims.batchId, batchId))

    if (!batchClaims || !Array.isArray(batchClaims)) {
      console.error(`No valid claims found for batch ${batchId}`)
      return
    }

    const totalClaims = batchClaims.length
    const completedClaims = batchClaims.filter(claim => claim?.status === "completed").length
    const totalAmount = batchClaims.reduce((sum, claim) => {
      if (!claim || !claim.totalCostOfCare) return sum
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
  } catch (error) {
    console.error(`Error updating batch statistics for batch ${batchId}:`, error)
    // Don't throw the error to prevent the main operation from failing
  }
}