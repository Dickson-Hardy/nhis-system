// Batch closure reports and forwarding letter management
import { db } from "./index"
import { batches, claims, users, tpas, facilities } from "./schema"
import { eq, and, sql } from "drizzle-orm"

export interface BatchClosureReport {
  batchId: number
  batchNumber: string
  tpaName: string
  facilityName: string
  totalClaims: number
  totalAmount: number
  approvedAmount: number
  rejectedAmount: number
  approvedClaims: number
  rejectedClaims: number
  duplicateClaims: number
  ineligibleClaims: number
  
  // Payment Details
  paidAmount?: number
  paidClaims?: number
  beneficiariesPaid?: number
  paymentDate?: Date
  
  // Review Details
  reviewSummary: string
  paymentJustification: string
  rejectionReasons: Array<{
    reason: string
    count: number
    amount: number
  }>
  
  // Attachments
  forwardingLetterUrl?: string
  forwardingLetterFileName?: string
  additionalDocuments?: Array<{
    url: string
    fileName: string
    type: string
  }>
  
  // E-signatures
  tpaSignature?: string
  tpaSignedBy?: string
  tpaSignedAt?: Date
  adminSignature?: string
  adminSignedBy?: string
  adminSignedAt?: Date
  
  // Timestamps
  closedAt?: Date
  reportGeneratedAt: Date
  submittedBy: number
}

export interface BatchPaymentSummary {
  batchId: number
  totalPaidAmount: number
  numberOfBeneficiaries: number
  paymentDate: Date
  paymentMethod: string
  paymentReference: string
  remarks?: string
  submittedBy: number
  submittedAt: Date
}

export async function generateBatchClosureReport(batchId: number): Promise<BatchClosureReport> {
  // Get batch details with related data
  const batchResult = await db
    .select({
      batch: batches,
      tpa: tpas,
      facility: facilities,
    })
    .from(batches)
    .leftJoin(tpas, eq(batches.tpaId, tpas.id))
    .leftJoin(facilities, eq(batches.facilityId, facilities.id))
    .where(eq(batches.id, batchId))
    .limit(1)

  if (batchResult.length === 0) {
    throw new Error(`Batch ${batchId} not found`)
  }

  const { batch, tpa, facility } = batchResult[0]

  // Get claim statistics
  const claimStats = await db
    .select({
      totalClaims: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${claims.totalCostOfCare}) filter (where ${claims.totalCostOfCare} is not null)`,
      approvedAmount: sql<number>`sum(${claims.approvedCostOfCare}) filter (where ${claims.decision} = 'approved')`,
      approvedClaims: sql<number>`count(*) filter (where ${claims.decision} = 'approved')`,
      rejectedClaims: sql<number>`count(*) filter (where ${claims.decision} = 'rejected')`,
    })
    .from(claims)
    .where(eq(claims.batchId, batchId))

  const stats = claimStats[0]

  // Get rejection reasons breakdown
  const rejectionReasons = await db
    .select({
      reason: claims.reasonForRejection,
      count: sql<number>`count(*)`,
      amount: sql<number>`sum(${claims.totalCostOfCare}) filter (where ${claims.totalCostOfCare} is not null)`,
    })
    .from(claims)
    .where(and(eq(claims.batchId, batchId), eq(claims.decision, "rejected")))
    .groupBy(claims.reasonForRejection)

  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    tpaName: tpa?.name || "Unknown TPA",
    facilityName: facility?.name || "Unknown Facility",
    totalClaims: stats.totalClaims || 0,
    totalAmount: stats.totalAmount || 0,
    approvedAmount: stats.approvedAmount || 0,
    rejectedAmount: (stats.totalAmount || 0) - (stats.approvedAmount || 0),
    approvedClaims: stats.approvedClaims || 0,
    rejectedClaims: stats.rejectedClaims || 0,
    duplicateClaims: 0, // TODO: Implement duplicate detection
    ineligibleClaims: 0, // TODO: Implement eligibility checking
    reviewSummary: "",
    paymentJustification: "",
    rejectionReasons: rejectionReasons.map(r => ({
      reason: r.reason || "No reason provided",
      count: r.count || 0,
      amount: r.amount || 0,
    })),
    forwardingLetterUrl: batch.coverLetterUrl || undefined,
    forwardingLetterFileName: batch.coverLetterFileName || undefined,
    reportGeneratedAt: new Date(),
    submittedBy: batch.createdBy || 0,
  }
}

export async function updateBatchWithClosureData(
  batchId: number,
  reportData: Partial<BatchClosureReport>,
  userId: number
): Promise<void> {
  await db
    .update(batches)
    .set({
      status: "closed",
      closedAt: new Date(),
      submissionNotes: reportData.reviewSummary,
      updatedAt: new Date(),
    })
    .where(eq(batches.id, batchId))
}

export async function submitPaymentSummary(
  paymentData: BatchPaymentSummary
): Promise<void> {
  // Update batch with payment information
  await db
    .update(batches)
    .set({
      status: "verified_paid",
      approvedAmount: paymentData.totalPaidAmount.toString(),
      updatedAt: new Date(),
    })
    .where(eq(batches.id, paymentData.batchId))

  // TODO: Create payment record in financial transactions table
  // This would integrate with the financial management system
}