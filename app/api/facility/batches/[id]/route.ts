import { NextRequest, NextResponse } from "next/server"
import { eq, and, count, sum } from "drizzle-orm"
import { db } from "@/lib/db"
import { batches, claims, facilities, tpas } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// GET /api/facility/batches/[id] - Get specific batch details
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

    const batchId = parseInt(params.id)
    if (isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 })
    }

    // Get batch details with TPA and facility information
    const batch = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        batchType: batches.batchType,
        weekStartDate: batches.weekStartDate,
        weekEndDate: batches.weekEndDate,
        status: batches.status,
        totalClaims: batches.totalClaims,
        completedClaims: batches.completedClaims,
        totalAmount: batches.totalAmount,
        approvedAmount: batches.approvedAmount,
        adminFeePercentage: batches.adminFeePercentage,
        adminFeeAmount: batches.adminFeeAmount,
        netAmount: batches.netAmount,
        forwardingLetterContent: batches.forwardingLetterContent,
        forwardingLetterGenerated: batches.forwardingLetterGenerated,
        coverLetterUrl: batches.coverLetterUrl,
        coverLetterFileName: batches.coverLetterFileName,
        submissionEmails: batches.submissionEmails,
        submissionNotes: batches.submissionNotes,
        submittedAt: batches.submittedAt,
        createdAt: batches.createdAt,
        updatedAt: batches.updatedAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
          contactEmail: tpas.contactEmail,
        },
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
        }
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .leftJoin(facilities, eq(batches.facilityId, facilities.id))
      .where(
        and(
          eq(batches.id, batchId),
          eq(batches.facilityId, user.facilityId!)
        )
      )
      .limit(1)

    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // Get claims in this batch
    const batchClaims = await db
      .select()
      .from(claims)
      .where(eq(claims.batchId, batchId))

    return NextResponse.json({
      batch: {
        ...batch[0],
        submissionEmails: batch[0].submissionEmails ? JSON.parse(batch[0].submissionEmails) : [],
      },
      claims: batchClaims,
    })
  } catch (error) {
    console.error("Error fetching batch details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/facility/batches/[id] - Update batch
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

    const batchId = parseInt(params.id)
    if (isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 })
    }

    const body = await request.json()
    const { action, submissionEmails, submissionNotes, forwardingLetterContent } = body

    // Check if batch exists and belongs to facility
    const existingBatch = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.id, batchId),
          eq(batches.facilityId, user.facilityId!)
        )
      )
      .limit(1)

    if (existingBatch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const batch = existingBatch[0]
    const updateData: any = { updatedAt: new Date() }

    switch (action) {
      case "update_details":
        if (batch.status !== "draft") {
          return NextResponse.json({ error: "Can only update draft batches" }, { status: 400 })
        }
        if (submissionEmails) updateData.submissionEmails = JSON.stringify(submissionEmails)
        if (submissionNotes) updateData.submissionNotes = submissionNotes
        break

      case "generate_forwarding_letter":
        if (batch.status !== "draft" && batch.status !== "ready_for_submission") {
          return NextResponse.json({ error: "Cannot generate forwarding letter for this batch status" }, { status: 400 })
        }
        
        // Generate forwarding letter content
        const letterContent = await generateForwardingLetter(batch, user.facilityId!)
        updateData.forwardingLetterContent = letterContent
        updateData.forwardingLetterGenerated = true
        updateData.status = "ready_for_submission"
        break

      case "submit":
        if (batch.status !== "ready_for_submission") {
          return NextResponse.json({ error: "Batch must be ready for submission" }, { status: 400 })
        }
        if (!batch.forwardingLetterGenerated) {
          return NextResponse.json({ error: "Forwarding letter must be generated before submission" }, { status: 400 })
        }
        if (!batch.coverLetterUrl) {
          return NextResponse.json({ error: "Cover letter must be uploaded before submission" }, { status: 400 })
        }

        // Calculate batch totals
        const batchStats = await calculateBatchTotals(batchId)
        
        updateData.status = "submitted"
        updateData.submittedAt = new Date()
        updateData.submittedBy = user.id
        updateData.totalClaims = batchStats.totalClaims
        updateData.completedClaims = batchStats.completedClaims
        updateData.totalAmount = batchStats.totalAmount

        // Send notification emails
        if (batch.submissionEmails) {
          const emails = JSON.parse(batch.submissionEmails)
          await sendBatchSubmissionNotification(batch, emails)
        }
        break

      case "close":
        if (batch.status !== "submitted") {
          return NextResponse.json({ error: "Only submitted batches can be closed" }, { status: 400 })
        }
        updateData.status = "under_review"
        updateData.closedAt = new Date()
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedBatch = await db
      .update(batches)
      .set(updateData)
      .where(eq(batches.id, batchId))
      .returning()

    return NextResponse.json({
      message: "Batch updated successfully",
      batch: updatedBatch[0],
    })
  } catch (error) {
    console.error("Error updating batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facility/batches/[id]/upload-cover-letter - Upload cover letter
export async function POST(
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

    const batchId = parseInt(params.id)
    if (isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 })
    }

    // Check if batch exists and belongs to facility
    const existingBatch = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.id, batchId),
          eq(batches.facilityId, user.facilityId!)
        )
      )
      .limit(1)

    if (existingBatch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const batch = existingBatch[0]

    if (batch.status !== "draft" && batch.status !== "ready_for_submission") {
      return NextResponse.json({ error: "Cannot upload cover letter for this batch status" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("coverLetter") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and image files are allowed." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 })
    }

    // Delete existing cover letter if any
    if (batch.coverLetterPublicId) {
      try {
        await deleteFromCloudinary(batch.coverLetterPublicId)
      } catch (error) {
        console.error("Error deleting existing cover letter:", error)
      }
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToCloudinary(buffer, file.name, "nhis-cover-letters")

    // Update batch with cover letter details
    const updatedBatch = await db
      .update(batches)
      .set({
        coverLetterUrl: uploadResult.secure_url,
        coverLetterPublicId: uploadResult.public_id,
        coverLetterFileName: uploadResult.original_filename,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId))
      .returning()

    return NextResponse.json({
      message: "Cover letter uploaded successfully",
      batch: updatedBatch[0],
      uploadResult,
    })
  } catch (error) {
    console.error("Error uploading cover letter:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
async function calculateBatchTotals(batchId: number) {
  const stats = await db
    .select({
      totalClaims: count(),
      totalAmount: sum(claims.totalCostOfCare),
    })
    .from(claims)
    .where(eq(claims.batchId, batchId))

  const completedClaims = await db
    .select({ count: count() })
    .from(claims)
    .where(
      and(
        eq(claims.batchId, batchId),
        eq(claims.status, "completed")
      )
    )

  return {
    totalClaims: stats[0]?.totalClaims || 0,
    completedClaims: completedClaims[0]?.count || 0,
    totalAmount: stats[0]?.totalAmount || 0,
  }
}

async function generateForwardingLetter(batch: any, facilityId: number) {
  // Get facility details
  const facility = await db
    .select()
    .from(facilities)
    .where(eq(facilities.id, facilityId))
    .limit(1)

  const facilityName = facility[0]?.name || "Healthcare Facility"
  const currentDate = new Date().toLocaleDateString()

  return `
FORWARDING LETTER

Date: ${currentDate}
Batch Number: ${batch.batchNumber}
Facility: ${facilityName}

Dear TPA Team,

We are pleased to forward the attached batch of claims for the period from ${new Date(batch.weekStartDate).toLocaleDateString()} to ${new Date(batch.weekEndDate).toLocaleDateString()}.

This batch contains claims for cesarean section procedures completed during the specified period. All claims have been thoroughly reviewed and verified by our medical and administrative teams.

Batch Summary:
- Batch Number: ${batch.batchNumber}
- Period: ${new Date(batch.weekStartDate).toLocaleDateString()} - ${new Date(batch.weekEndDate).toLocaleDateString()}
- Type: ${batch.batchType}

We request your prompt processing of these claims in accordance with the established procedures and timelines.

Should you require any additional information or clarification regarding any of the submitted claims, please do not hesitate to contact our claims department.

Thank you for your continued partnership.

Sincerely,

${facilityName}
Claims Department
`
}

async function sendBatchSubmissionNotification(batch: any, emails: string[]) {
  // This would integrate with your email service
  // For now, we'll just log the notification
  console.log(`Batch submission notification sent to: ${emails.join(', ')}`)
  console.log(`Batch: ${batch.batchNumber} has been submitted for review`)
}