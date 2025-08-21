import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { 
  batches, 
  claims, 
  users, 
  tpas, 
  facilities,
  batchClosureReports,
  batchPaymentSummaries 
} from "@/lib/db/schema"
import { eq, and, sql, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    // Get payment summaries with related data
    const paymentSummaries = await db
      .select({
        id: batchPaymentSummaries.id,
        batchId: batchPaymentSummaries.batchId,
        batchNumber: batches.batchNumber,
        tpaName: tpas.name,
        facilityName: facilities.name,
        totalPaidAmount: batchPaymentSummaries.totalPaidAmount,
        numberOfBeneficiaries: batchPaymentSummaries.numberOfBeneficiaries,
        paymentDate: batchPaymentSummaries.paymentDate,
        paymentMethod: batchPaymentSummaries.paymentMethod,
        paymentReference: batchPaymentSummaries.paymentReference,
        status: batchPaymentSummaries.status,
        submittedBy: users.name,
        submittedAt: batchPaymentSummaries.submittedAt,
        forwardingLetterUrl: batches.coverLetterUrl,
      })
      .from(batchPaymentSummaries)
      .leftJoin(batches, eq(batchPaymentSummaries.batchId, batches.id))
      .leftJoin(tpas, eq(batchPaymentSummaries.tpaId, tpas.id))
      .leftJoin(facilities, eq(batchPaymentSummaries.facilityId, facilities.id))
      .leftJoin(users, eq(batchPaymentSummaries.submittedBy, users.id))
      .orderBy(desc(batchPaymentSummaries.submittedAt))

    // Get summary statistics
    const summaryStats = await db
      .select({
        totalPayments: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${batchPaymentSummaries.totalPaidAmount})`,
        totalBeneficiaries: sql<number>`sum(${batchPaymentSummaries.numberOfBeneficiaries})`,
        pendingCount: sql<number>`count(*) filter (where ${batchPaymentSummaries.status} = 'active')`,
      })
      .from(batchPaymentSummaries)

    const stats = summaryStats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalBeneficiaries: 0,
      pendingCount: 0,
    }

    return NextResponse.json({
      paymentSummaries,
      totalPayments: stats.totalPayments || 0,
      totalAmount: parseFloat(stats.totalAmount?.toString() || "0"),
      totalBeneficiaries: stats.totalBeneficiaries || 0,
      pendingCount: stats.pendingCount || 0,
    })

  } catch (error) {
    console.error("Error fetching payment summaries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, status, notes, userId } = body

    if (!batchId || !status || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update payment summary status
    await db
      .update(batchPaymentSummaries)
      .set({
        status,
        processedBy: userId,
        processedAt: new Date(),
        remarks: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(batchPaymentSummaries.batchId, batchId))

    return NextResponse.json({
      success: true,
      message: "Payment summary updated successfully",
    })

  } catch (error) {
    console.error("Error updating payment summary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}