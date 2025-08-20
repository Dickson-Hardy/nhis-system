import { type NextRequest, NextResponse } from "next/server"
import { db, claims, facilities, tpas } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/claims/[id] - Get specific claim
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id } = await params
    const claimId = Number.parseInt(id)

    const claimData = await db
      .select({
        id: claims.id,
        serialNumber: claims.serialNumber,
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        uniqueClaimId: claims.uniqueClaimId,
        batchNumber: claims.batchNumber,
        hospitalNumber: claims.hospitalNumber,
        dateOfAdmission: claims.dateOfAdmission,
        beneficiaryName: claims.beneficiaryName,
        dateOfBirth: claims.dateOfBirth,
        age: claims.age,
        address: claims.address,
        phoneNumber: claims.phoneNumber,
        nin: claims.nin,
        dateOfTreatment: claims.dateOfTreatment,
        dateOfDischarge: claims.dateOfDischarge,
        primaryDiagnosis: claims.primaryDiagnosis,
        secondaryDiagnosis: claims.secondaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        quantity: claims.quantity,
        cost: claims.cost,
        dateOfClaimSubmission: claims.dateOfClaimSubmission,
        monthOfSubmission: claims.monthOfSubmission,
        costOfInvestigation: claims.costOfInvestigation,
        costOfProcedure: claims.costOfProcedure,
        costOfMedication: claims.costOfMedication,
        costOfOtherServices: claims.costOfOtherServices,
        totalCostOfCare: claims.totalCostOfCare,
        approvedCostOfCare: claims.approvedCostOfCare,
        decision: claims.decision,
        reasonForRejection: claims.reasonForRejection,
        dateOfClaimsPayment: claims.dateOfClaimsPayment,
        tpaRemarks: claims.tpaRemarks,
        status: claims.status,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
          state: facilities.state,
          address: facilities.address,
          contactEmail: facilities.contactEmail,
          contactPhone: facilities.contactPhone,
        },
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
          contactEmail: tpas.contactEmail,
          contactPhone: tpas.contactPhone,
        },
      })
      .from(claims)
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .where(eq(claims.id, claimId))

    if (claimData.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Role-based access control
    const claim = claimData[0]
    if (user.role === "tpa" && claim.tpa?.id !== user.tpaId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (user.role === "facility" && claim.facility?.id !== user.facilityId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ claim })
  } catch (error) {
    console.error("Error fetching claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/claims/[id] - Update claim
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id } = await params
    const claimId = Number.parseInt(id)
    const body = await request.json()

    // Handle date fields properly - convert string dates to YYYY-MM-DD format for PostgreSQL date type
    const processDateField = (dateValue: any) => {
      if (!dateValue) return null
      if (typeof dateValue === 'string') {
        // Handle both ISO strings and date strings
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null
        return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
      }
      return null
    }

    // Only include fields that exist in the claims table schema
    const allowedFields = [
      'serialNumber', 'uniqueBeneficiaryId', 'uniqueClaimId', 'batchNumber', 'hospitalNumber',
      'beneficiaryName', 'age', 'address', 'phoneNumber', 'nin',
      'primaryDiagnosis', 'secondaryDiagnosis', 'treatmentProcedure', 'quantity', 'cost',
      'monthOfSubmission', 'costOfInvestigation', 'costOfProcedure', 'costOfMedication', 
      'costOfOtherServices', 'totalCostOfCare', 'approvedCostOfCare', 'decision', 
      'reasonForRejection', 'tpaRemarks', 'status'
    ]

    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only include allowed fields from the request body
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Process date fields specifically
    if (body.dateOfAdmission !== undefined) {
      updateData.dateOfAdmission = processDateField(body.dateOfAdmission)
    }
    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = processDateField(body.dateOfBirth)
    }
    if (body.dateOfTreatment !== undefined) {
      updateData.dateOfTreatment = processDateField(body.dateOfTreatment)
    }
    if (body.dateOfDischarge !== undefined) {
      updateData.dateOfDischarge = processDateField(body.dateOfDischarge)
    }
    if (body.dateOfClaimSubmission !== undefined) {
      updateData.dateOfClaimSubmission = processDateField(body.dateOfClaimSubmission)
    }
    if (body.dateOfClaimsPayment !== undefined) {
      updateData.dateOfClaimsPayment = processDateField(body.dateOfClaimsPayment)
    }

    // Remove null and undefined values to avoid database issues
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key]
      }
    })

    console.log('Filtered update data being sent to database:', JSON.stringify(updateData, null, 2))

    const updatedClaim = await db.update(claims).set(updateData).where(eq(claims.id, claimId)).returning()

    if (updatedClaim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    return NextResponse.json({ claim: updatedClaim[0] })
  } catch (error) {
    console.error("Error updating claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/claims/[id] - Delete claim
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = await params
    const claimId = Number.parseInt(id)

    const deletedClaim = await db.delete(claims).where(eq(claims.id, claimId)).returning()

    if (deletedClaim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Claim deleted successfully" })
  } catch (error) {
    console.error("Error deleting claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
