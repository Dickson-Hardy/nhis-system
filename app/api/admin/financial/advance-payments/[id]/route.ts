import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { advancePayments, financialTransactions } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// GET /api/admin/financial/advance-payments/[id] - Get specific advance payment
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

    const paymentId = parseInt(params.id)
    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 })
    }

    const payment = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, paymentId))
      .limit(1)

    if (payment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ payment: payment[0] })
  } catch (error) {
    console.error("Error fetching advance payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/financial/advance-payments/[id] - Update advance payment
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

    const paymentId = parseInt(params.id)
    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, action } = body

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, paymentId))
      .limit(1)

    if (existingPayment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const payment = existingPayment[0]
    const updateData: any = { updatedAt: new Date() }

    // Handle different actions
    switch (action) {
      case "approve":
        if (payment.status !== "pending") {
          return NextResponse.json({ error: "Only pending payments can be approved" }, { status: 400 })
        }
        updateData.status = "approved"
        updateData.approvedBy = user.id
        updateData.approvedAt = new Date()
        break

      case "disburse":
        if (payment.status !== "approved") {
          return NextResponse.json({ error: "Only approved payments can be disbursed" }, { status: 400 })
        }
        updateData.status = "disbursed"
        updateData.disbursedBy = user.id
        updateData.disbursedAt = new Date()

        // Create financial transaction record
        await db.insert(financialTransactions).values({
          transactionType: "advance_payment",
          referenceType: "advance_payment",
          referenceId: paymentId,
          tpaId: payment.tpaId,
          amount: payment.amount,
          transactionDate: new Date(),
          description: `Advance payment disbursed - ${payment.paymentReference}`,
          status: "active",
          createdBy: user.id,
          createdAt: new Date(),
        })
        break

      case "cancel":
        if (payment.status === "disbursed") {
          return NextResponse.json({ error: "Disbursed payments cannot be cancelled" }, { status: 400 })
        }
        updateData.status = "cancelled"
        break

      case "reconcile":
        if (payment.status !== "disbursed") {
          return NextResponse.json({ error: "Only disbursed payments can be reconciled" }, { status: 400 })
        }
        updateData.isReconciled = true
        updateData.reconciledBy = user.id
        updateData.reconciledAt = new Date()
        break

      default:
        // General update
        if (status) updateData.status = status
        break
    }

    const updatedPayment = await db
      .update(advancePayments)
      .set(updateData)
      .where(eq(advancePayments.id, paymentId))
      .returning()

    return NextResponse.json({
      message: "Payment updated successfully",
      payment: updatedPayment[0],
    })
  } catch (error) {
    console.error("Error updating advance payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/financial/advance-payments/[id]/upload - Upload receipt
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

    const paymentId = parseInt(params.id)
    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 })
    }

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, paymentId))
      .limit(1)

    if (existingPayment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("receipt") as File

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

    // Delete existing receipt if any
    const payment = existingPayment[0]
    if (payment.receiptPublicId) {
      try {
        await deleteFromCloudinary(payment.receiptPublicId)
      } catch (error) {
        console.error("Error deleting existing receipt:", error)
      }
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToCloudinary(buffer, file.name, "nhis-advance-payments")

    // Update payment with receipt details
    const updatedPayment = await db
      .update(advancePayments)
      .set({
        receiptUrl: uploadResult.secure_url,
        receiptPublicId: uploadResult.public_id,
        receiptFileName: uploadResult.original_filename,
        updatedAt: new Date(),
      })
      .where(eq(advancePayments.id, paymentId))
      .returning()

    return NextResponse.json({
      message: "Receipt uploaded successfully",
      payment: updatedPayment[0],
      uploadResult,
    })
  } catch (error) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}