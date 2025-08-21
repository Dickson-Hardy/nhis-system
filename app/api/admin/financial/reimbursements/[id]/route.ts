import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { reimbursements, financialTransactions } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// GET /api/admin/financial/reimbursements/[id] - Get specific reimbursement
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
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const reimbursementId = parseInt(params.id)
    if (isNaN(reimbursementId)) {
      return NextResponse.json({ error: "Invalid reimbursement ID" }, { status: 400 })
    }

    const reimbursement = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.id, reimbursementId))
      .limit(1)

    if (reimbursement.length === 0) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    return NextResponse.json({ reimbursement: reimbursement[0] })
  } catch (error) {
    console.error("Error fetching reimbursement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/financial/reimbursements/[id] - Update reimbursement
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
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const reimbursementId = parseInt(params.id)
    if (isNaN(reimbursementId)) {
      return NextResponse.json({ error: "Invalid reimbursement ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, action, processingNotes } = body

    // Check if reimbursement exists
    const existingReimbursement = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.id, reimbursementId))
      .limit(1)

    if (existingReimbursement.length === 0) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    const reimbursement = existingReimbursement[0]
    const updateData: any = { updatedAt: new Date() }

    // Handle different actions
    switch (action) {
      case "process":
        if (reimbursement.status !== "pending") {
          return NextResponse.json({ error: "Only pending reimbursements can be processed" }, { status: 400 })
        }
        updateData.status = "processed"
        updateData.processedBy = user.id
        updateData.processedAt = new Date()
        updateData.processingNotes = processingNotes
        break

      case "complete":
        if (reimbursement.status !== "processed") {
          return NextResponse.json({ error: "Only processed reimbursements can be completed" }, { status: 400 })
        }
        updateData.status = "completed"

        // Create financial transaction record
        await db.insert(financialTransactions).values({
          transactionType: "reimbursement",
          referenceType: "reimbursement",
          referenceId: reimbursementId,
          tpaId: reimbursement.tpaId,
          amount: reimbursement.amount,
          transactionDate: new Date(),
          description: `Batch reimbursement completed - ${reimbursement.reimbursementReference}`,
          status: "active",
          createdBy: user.id,
          createdAt: new Date(),
        })
        break

      case "dispute":
        updateData.status = "disputed"
        updateData.processingNotes = processingNotes
        break

      case "cancel":
        if (reimbursement.status === "completed") {
          return NextResponse.json({ error: "Completed reimbursements cannot be cancelled" }, { status: 400 })
        }
        updateData.status = "cancelled"
        break

      default:
        // General update
        if (status) updateData.status = status
        if (processingNotes) updateData.processingNotes = processingNotes
        break
    }

    const updatedReimbursement = await db
      .update(reimbursements)
      .set(updateData)
      .where(eq(reimbursements.id, reimbursementId))
      .returning()

    return NextResponse.json({
      message: "Reimbursement updated successfully",
      reimbursement: updatedReimbursement[0],
    })
  } catch (error) {
    console.error("Error updating reimbursement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/financial/reimbursements/[id]/upload - Upload receipt/documents
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
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const reimbursementId = parseInt(params.id)
    if (isNaN(reimbursementId)) {
      return NextResponse.json({ error: "Invalid reimbursement ID" }, { status: 400 })
    }

    // Check if reimbursement exists
    const existingReimbursement = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.id, reimbursementId))
      .limit(1)

    if (existingReimbursement.length === 0) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const receiptFile = formData.get("receipt") as File
    const supportingDocs = formData.getAll("supportingDocs") as File[]
    const documentType = formData.get("documentType") as string // "receipt" or "supporting"

    const uploadResults: any = {}

    // Handle receipt upload
    if (receiptFile && documentType === "receipt") {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(receiptFile.type)) {
        return NextResponse.json({ error: "Invalid file type. Only PDF and image files are allowed." }, { status: 400 })
      }

      // Validate file size (max 5MB)
      if (receiptFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 })
      }

      // Delete existing receipt if any
      const reimbursement = existingReimbursement[0]
      if (reimbursement.receiptPublicId) {
        try {
          await deleteFromCloudinary(reimbursement.receiptPublicId)
        } catch (error) {
          console.error("Error deleting existing receipt:", error)
        }
      }

      // Upload receipt to Cloudinary
      const buffer = Buffer.from(await receiptFile.arrayBuffer())
      const uploadResult = await uploadToCloudinary(buffer, receiptFile.name, "nhis-reimbursements")

      // Update reimbursement with receipt details
      await db
        .update(reimbursements)
        .set({
          receiptUrl: uploadResult.secure_url,
          receiptPublicId: uploadResult.public_id,
          receiptFileName: uploadResult.original_filename,
          updatedAt: new Date(),
        })
        .where(eq(reimbursements.id, reimbursementId))

      uploadResults.receipt = uploadResult
    }

    // Handle supporting documents upload
    if (supportingDocs.length > 0 && documentType === "supporting") {
      const supportingDocsResults = []

      for (const doc of supportingDocs) {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(doc.type)) {
          continue // Skip invalid file types
        }

        // Validate file size (max 5MB)
        if (doc.size > 5 * 1024 * 1024) {
          continue // Skip files that are too large
        }

        try {
          const buffer = Buffer.from(await doc.arrayBuffer())
          const uploadResult = await uploadToCloudinary(buffer, doc.name, "nhis-reimbursements-docs")
          supportingDocsResults.push(uploadResult)
        } catch (error) {
          console.error("Error uploading supporting document:", error)
        }
      }

      if (supportingDocsResults.length > 0) {
        // Get existing supporting docs
        const reimbursement = existingReimbursement[0]
        let existingUrls: string[] = []
        let existingPublicIds: string[] = []

        if (reimbursement.supportingDocsUrls) {
          try {
            existingUrls = JSON.parse(reimbursement.supportingDocsUrls)
          } catch (error) {
            console.error("Error parsing existing URLs:", error)
          }
        }

        if (reimbursement.supportingDocsPublicIds) {
          try {
            existingPublicIds = JSON.parse(reimbursement.supportingDocsPublicIds)
          } catch (error) {
            console.error("Error parsing existing public IDs:", error)
          }
        }

        // Add new docs to existing ones
        const newUrls = [...existingUrls, ...supportingDocsResults.map(r => r.secure_url)]
        const newPublicIds = [...existingPublicIds, ...supportingDocsResults.map(r => r.public_id)]

        // Update reimbursement with new supporting docs
        await db
          .update(reimbursements)
          .set({
            supportingDocsUrls: JSON.stringify(newUrls),
            supportingDocsPublicIds: JSON.stringify(newPublicIds),
            updatedAt: new Date(),
          })
          .where(eq(reimbursements.id, reimbursementId))

        uploadResults.supportingDocs = supportingDocsResults
      }
    }

    // Get updated reimbursement
    const updatedReimbursement = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.id, reimbursementId))
      .limit(1)

    return NextResponse.json({
      message: "Documents uploaded successfully",
      reimbursement: updatedReimbursement[0],
      uploadResults,
    })
  } catch (error) {
    console.error("Error uploading documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}