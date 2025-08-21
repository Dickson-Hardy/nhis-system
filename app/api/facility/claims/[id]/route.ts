import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { claims, batches } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/facility/claims/[id] - Get specific claim details
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

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    const claimId = parseInt(params.id)
    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 })
    }

    // Get claim with batch information
    const claim = await db
      .select({
        id: claims.id,
        uniqueClaimId: claims.uniqueClaimId,
        facilityId: claims.facilityId,
        tpaId: claims.tpaId,
        batchId: claims.batchId,
        
        // Patient Information
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        hospitalNumber: claims.hospitalNumber,
        beneficiaryName: claims.beneficiaryName,
        dateOfBirth: claims.dateOfBirth,
        age: claims.age,
        address: claims.address,
        phoneNumber: claims.phoneNumber,
        nin: claims.nin,
        
        // Treatment Information
        dateOfAdmission: claims.dateOfAdmission,
        dateOfTreatment: claims.dateOfTreatment,
        dateOfDischarge: claims.dateOfDischarge,
        primaryDiagnosis: claims.primaryDiagnosis,
        secondaryDiagnosis: claims.secondaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        quantity: claims.quantity,
        
        // Cost Information
        costOfInvestigation: claims.costOfInvestigation,
        costOfProcedure: claims.costOfProcedure,
        costOfMedication: claims.costOfMedication,
        costOfOtherServices: claims.costOfOtherServices,
        totalCostOfCare: claims.totalCostOfCare,
        
        status: claims.status,
        rejectionReason: claims.rejectionReason,
        createdBy: claims.createdBy,
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
      .where(
        and(
          eq(claims.id, claimId),
          eq(claims.facilityId, user.facilityId)
        )
      )
      .limit(1)

    if (claim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    return NextResponse.json({ claim: claim[0] })
  } catch (error) {
    console.error("Error fetching claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/facility/claims/[id] - Update claim
export async function PUT(
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

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    const claimId = parseInt(params.id)
    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 })
    }

    // Verify claim belongs to this facility
    const existingClaim = await db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.id, claimId),
          eq(claims.facilityId, user.facilityId)
        )
      )
      .limit(1)

    if (existingClaim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Check if claim can be edited (only draft and returned claims can be edited)
    if (!existingClaim[0].status || !["draft", "returned"].includes(existingClaim[0].status)) {
      return NextResponse.json({ 
        error: "Cannot edit claim - only draft and returned claims can be modified" 
      }, { status: 400 })
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
      
      // Status
      status,
    } = body

    // Calculate total cost if cost fields are provided
    let totalCostOfCare = existingClaim[0].totalCostOfCare
    if (costOfInvestigation !== undefined || costOfProcedure !== undefined || 
        costOfMedication !== undefined || costOfOtherServices !== undefined) {
      const investigation = parseFloat(costOfInvestigation) || 0
      const procedure = parseFloat(costOfProcedure) || 0
      const medication = parseFloat(costOfMedication) || 0
      const otherServices = parseFloat(costOfOtherServices) || 0
      totalCostOfCare = (investigation + procedure + medication + otherServices).toString()
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Patient Information
    if (uniqueBeneficiaryId !== undefined) updateData.uniqueBeneficiaryId = uniqueBeneficiaryId
    if (hospitalNumber !== undefined) updateData.hospitalNumber = hospitalNumber
    if (beneficiaryName !== undefined) updateData.beneficiaryName = beneficiaryName
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (age !== undefined) updateData.age = parseInt(age)
    if (address !== undefined) updateData.address = address
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (nin !== undefined) updateData.nin = nin

    // Treatment Information
    if (dateOfAdmission !== undefined) updateData.dateOfAdmission = dateOfAdmission
    if (dateOfTreatment !== undefined) updateData.dateOfTreatment = dateOfTreatment
    if (dateOfDischarge !== undefined) updateData.dateOfDischarge = dateOfDischarge
    if (primaryDiagnosis !== undefined) updateData.primaryDiagnosis = primaryDiagnosis
    if (secondaryDiagnosis !== undefined) updateData.secondaryDiagnosis = secondaryDiagnosis
    if (treatmentProcedure !== undefined) updateData.treatmentProcedure = treatmentProcedure
    if (quantity !== undefined) updateData.quantity = quantity ? parseInt(quantity) : null

    // Cost Information
    if (costOfInvestigation !== undefined) updateData.costOfInvestigation = parseFloat(costOfInvestigation).toString()
    if (costOfProcedure !== undefined) updateData.costOfProcedure = parseFloat(costOfProcedure).toString()
    if (costOfMedication !== undefined) updateData.costOfMedication = parseFloat(costOfMedication).toString()
    if (costOfOtherServices !== undefined) updateData.costOfOtherServices = parseFloat(costOfOtherServices).toString()
    updateData.totalCostOfCare = totalCostOfCare

    // Status
    if (status !== undefined) updateData.status = status

    // Update claim
    const updatedClaim = await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, claimId))
      .returning()

    // Update batch statistics if claim is in a batch
    if (existingClaim[0].batchId) {
      await updateBatchStatistics(existingClaim[0].batchId)
    }

    return NextResponse.json({
      message: "Claim updated successfully",
      claim: updatedClaim[0],
    })
  } catch (error) {
    console.error("Error updating claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/facility/claims/[id] - Delete claim
export async function DELETE(
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

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    const claimId = parseInt(params.id)
    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 })
    }

    // Verify claim belongs to this facility and can be deleted
    const existingClaim = await db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.id, claimId),
          eq(claims.facilityId, user.facilityId)
        )
      )
      .limit(1)

    if (existingClaim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Only allow deletion of draft claims
    if (existingClaim[0].status !== "draft") {
      return NextResponse.json({ 
        error: "Cannot delete claim - only draft claims can be deleted" 
      }, { status: 400 })
    }

    const batchId = existingClaim[0].batchId

    // Delete claim
    await db
      .delete(claims)
      .where(eq(claims.id, claimId))

    // Update batch statistics if claim was in a batch
    if (batchId) {
      await updateBatchStatistics(batchId)
    }

    return NextResponse.json({
      message: "Claim deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting claim:", error)
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