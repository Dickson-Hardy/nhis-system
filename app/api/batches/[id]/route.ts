import { type NextRequest, NextResponse } from "next/server"
import { db, batches, tpas, claims } from "@/lib/db"
import { eq, count, sum } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/batches/[id] - Fetch individual batch details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const resolvedParams = await params
    const batchId = Number.parseInt(resolvedParams.id)

    const batchData = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
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
          contactEmail: tpas.contactEmail,
        },
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .where(eq(batches.id, batchId))

    if (batchData.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const batch = batchData[0]

    // Role-based access control
    if (user.role === "tpa" && batch.tpa?.id !== user.tpaId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get claims in this batch
    const batchClaims = await db.select({
      id: claims.id,
      serialNumber: claims.serialNumber,
      uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
      uniqueClaimId: claims.uniqueClaimId,
      tpaId: claims.tpaId,
      facilityId: claims.facilityId,
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
      createdBy: claims.createdBy,
      createdAt: claims.createdAt,
      updatedAt: claims.updatedAt,
    }).from(claims).where(eq(claims.batchNumber, batch.batchNumber))

    return NextResponse.json({
      batch: {
        ...batch,
        claims: batchClaims,
      },
    })
  } catch (error) {
    console.error("Error fetching batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/batches/[id] - Update batch
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const batchId = Number.parseInt(params.id)
    const body = await request.json()

    // Recalculate totals if updating claims
    if (body.recalculateTotals) {
      const batch = await db.select().from(batches).where(eq(batches.id, batchId))
      if (batch.length === 0) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 })
      }

      const totals = await db
        .select({
          totalClaims: count(),
          totalAmount: sum(claims.totalCostOfCare),
        })
        .from(claims)
        .where(eq(claims.batchNumber, batch[0].batchNumber))

      body.totalClaims = totals[0].totalClaims
      body.totalAmount = totals[0].totalAmount || "0"
    }

    const updatedBatch = await db
      .update(batches)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId))
      .returning()

    if (updatedBatch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    return NextResponse.json({ batch: updatedBatch[0] })
  } catch (error) {
    console.error("Error updating batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/batches/[id] - Delete batch
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || (user.role !== "tpa" && user.role !== "nhis_admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const batchId = Number.parseInt(params.id)

    // Check if batch can be deleted (only draft batches)
    const batch = await db.select().from(batches).where(eq(batches.id, batchId))
    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    if (batch[0].status !== "draft") {
      return NextResponse.json({ error: "Cannot delete submitted batch" }, { status: 400 })
    }

    const deletedBatch = await db.delete(batches).where(eq(batches.id, batchId)).returning()

    return NextResponse.json({ message: "Batch deleted successfully" })
  } catch (error) {
    console.error("Error deleting batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
