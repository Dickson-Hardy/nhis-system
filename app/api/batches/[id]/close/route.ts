import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batches, claims, users, tpas, facilities } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { EmailService } from "@/lib/email"
import { generateBatchClosureReport, updateBatchWithClosureData, submitPaymentSummary } from "@/lib/db/batch-reports"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const batchId = parseInt(id)
    if (isNaN(batchId)) {
      return NextResponse.json(
        { error: "Invalid batch ID" },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    
    // Extract form data
    const reviewSummary = formData.get("reviewSummary") as string
    const paymentJustification = formData.get("paymentJustification") as string
    const paidAmount = parseFloat(formData.get("paidAmount") as string)
    const beneficiariesPaid = parseInt(formData.get("beneficiariesPaid") as string)
    const paymentDate = formData.get("paymentDate") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const paymentReference = formData.get("paymentReference") as string
    const remarks = formData.get("remarks") as string
    const tpaSignature = formData.get("tpaSignature") as string
    const userId = parseInt(formData.get("userId") as string)
    const forwardingLetterFile = formData.get("forwardingLetter") as File

    // Validate required fields
    if (!reviewSummary || !paymentJustification || !tpaSignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (isNaN(paidAmount) || isNaN(beneficiariesPaid)) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 }
      )
    }

    // Get batch details
    const batchResult = await db
      .select({
        batch: batches,
        tpa: tpas,
        user: users,
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .leftJoin(users, eq(batches.createdBy, users.id))
      .where(eq(batches.id, batchId))
      .limit(1)

    if (batchResult.length === 0) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      )
    }

    const { batch, tpa, user } = batchResult[0]

    // Check if batch is in correct state for closure (TPA autonomous closure after submission)
    if (batch.status !== "submitted") {
      return NextResponse.json(
        { error: "Batch must be submitted before it can be closed" },
        { status: 400 }
      )
    }

    let forwardingLetterUrl = null
    let forwardingLetterFileName = null
    let forwardingLetterPublicId = null

    // Upload forwarding letter if provided
    if (forwardingLetterFile && forwardingLetterFile.size > 0) {
      try {
        const bytes = await forwardingLetterFile.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "nhis/forwarding-letters",
              public_id: `batch-${batchId}-forwarding-letter-${Date.now()}`,
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          ).end(buffer)
        })

        const result = uploadResult as any
        forwardingLetterUrl = result.secure_url
        forwardingLetterPublicId = result.public_id
        forwardingLetterFileName = forwardingLetterFile.name
      } catch (error) {
        console.error("Error uploading forwarding letter:", error)
        return NextResponse.json(
          { error: "Failed to upload forwarding letter" },
          { status: 500 }
        )
      }
    }

    // Generate comprehensive batch closure report
    const closureReport = await generateBatchClosureReport(batchId)

    // Update closure report with form data
    closureReport.reviewSummary = reviewSummary
    closureReport.paymentJustification = paymentJustification
    closureReport.paidAmount = paidAmount
    closureReport.paidClaims = beneficiariesPaid // Assuming this represents paid claims
    closureReport.beneficiariesPaid = beneficiariesPaid
    closureReport.paymentDate = new Date(paymentDate)
    closureReport.forwardingLetterUrl = forwardingLetterUrl || undefined
    closureReport.forwardingLetterFileName = forwardingLetterFileName || undefined
    closureReport.tpaSignature = tpaSignature
    closureReport.tpaSignedBy = user?.name || "Unknown"
    closureReport.tpaSignedAt = new Date()
    closureReport.closedAt = new Date()

    // Update batch in database
    await db
      .update(batches)
      .set({
        status: "closed",
        closedAt: new Date(),
        submissionNotes: reviewSummary,
        approvedAmount: paidAmount.toString(),
        coverLetterUrl: forwardingLetterUrl,
        coverLetterPublicId: forwardingLetterPublicId,
        coverLetterFileName: forwardingLetterFileName,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId))

    // Submit payment summary to financial system
    await submitPaymentSummary({
      batchId,
      totalPaidAmount: paidAmount,
      numberOfBeneficiaries: beneficiariesPaid,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      paymentReference,
      remarks: remarks || undefined,
      submittedBy: userId,
      submittedAt: new Date(),
    })

    // Prepare email data
    const emailService = EmailService.getInstance()
    const batchClosureData = {
      batchNumber: batch.batchNumber,
      tpaName: tpa?.name || "Unknown TPA",
      facilityName: "Unknown Facility", // TODO: Get from claims table
      totalClaims: closureReport.totalClaims,
      totalAmount: closureReport.totalAmount,
      approvedAmount: closureReport.approvedAmount,
      rejectedAmount: closureReport.rejectedAmount,
      approvedClaims: closureReport.approvedClaims,
      rejectedClaims: closureReport.rejectedClaims,
      paymentJustification,
      reviewSummary,
      forwardingLetterUrl,
      submittedDate: new Date().toLocaleDateString(),
      tpaSignedBy: user?.name || "Unknown",
    }

    // Send notifications to all stakeholders
    const notifications = []

    // Skip facility notification for now since we don't have direct facility link
    // TODO: Get facility info from claims table if needed

    // 2. Send to NHIS officials (you can configure these email addresses)
    const nhisEmails = [
      process.env.DG_EMAIL || "dg@nhis.gov.ng",
      process.env.FINANCE_EMAIL || "finance@nhis.gov.ng",
      process.env.OPERATIONS_EMAIL || "operations@nhis.gov.ng",
    ].filter(Boolean)

    for (const email of nhisEmails) {
      notifications.push(
        emailService.sendBatchClosureNotification(
          email,
          "NHIS Administrator",
          batchClosureData,
          forwardingLetterUrl
        )
      )
    }

    // 3. Send confirmation to TPA
    if (tpa?.contactEmail) {
      notifications.push(
        emailService.sendBatchClosureNotification(
          tpa.contactEmail,
          tpa.name || "TPA Administrator",
          batchClosureData,
          forwardingLetterUrl
        )
      )
    }

    // Send all notifications
    try {
      await Promise.all(notifications)
      console.log(`Batch closure notifications sent for batch ${batch.batchNumber}`)
    } catch (error) {
      console.error("Error sending notifications:", error)
      // Don't fail the request if emails fail
    }

    return NextResponse.json({
      success: true,
      message: "Batch closed successfully",
      batchNumber: batch.batchNumber,
      paidAmount,
      beneficiariesPaid,
      notificationsSent: notifications.length,
    })

  } catch (error) {
    console.error("Error closing batch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const batchId = parseInt(id)
    if (isNaN(batchId)) {
      return NextResponse.json(
        { error: "Invalid batch ID" },
        { status: 400 }
      )
    }

    // Generate batch closure report for preview
    const report = await generateBatchClosureReport(batchId)
    
    return NextResponse.json(report)

  } catch (error) {
    console.error("Error generating batch report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}