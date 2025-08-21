import { NextRequest, NextResponse } from "next/server"
import { eq, desc, and, ilike, count, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { advancePayments, tpas, users } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/financial/advance-payments - Fetch advance payments
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const tpaId = searchParams.get("tpaId")

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []
    
    if (search) {
      whereConditions.push(
        ilike(advancePayments.paymentReference, `%${search}%`)
      )
    }
    
    if (status) {
      whereConditions.push(eq(advancePayments.status, status))
    }
    
    if (tpaId) {
      whereConditions.push(eq(advancePayments.tpaId, parseInt(tpaId)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch advance payments with TPA and user details
    const paymentsData = await db
      .select({
        id: advancePayments.id,
        tpaId: advancePayments.tpaId,
        amount: advancePayments.amount,
        paymentReference: advancePayments.paymentReference,
        paymentDate: advancePayments.paymentDate,
        paymentMethod: advancePayments.paymentMethod,
        description: advancePayments.description,
        purpose: advancePayments.purpose,
        receiptUrl: advancePayments.receiptUrl,
        receiptFileName: advancePayments.receiptFileName,
        status: advancePayments.status,
        approvedAt: advancePayments.approvedAt,
        disbursedAt: advancePayments.disbursedAt,
        isReconciled: advancePayments.isReconciled,
        reconciledAt: advancePayments.reconciledAt,
        createdAt: advancePayments.createdAt,
        updatedAt: advancePayments.updatedAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(advancePayments)
      .leftJoin(tpas, eq(advancePayments.tpaId, tpas.id))
      .leftJoin(users, eq(advancePayments.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(advancePayments.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCount = await db.select({ count: count() }).from(advancePayments).where(whereClause)

    // Get statistics
    const stats = await db
      .select({
        totalPayments: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${advancePayments.amount})`,
        pendingPayments: sql<number>`count(case when ${advancePayments.status} = 'pending' then 1 end)`,
        approvedPayments: sql<number>`count(case when ${advancePayments.status} = 'approved' then 1 end)`,
        disbursedPayments: sql<number>`count(case when ${advancePayments.status} = 'disbursed' then 1 end)`,
        pendingAmount: sql<number>`sum(case when ${advancePayments.status} = 'pending' then ${advancePayments.amount} else 0 end)`,
        disbursedAmount: sql<number>`sum(case when ${advancePayments.status} = 'disbursed' then ${advancePayments.amount} else 0 end)`,
      })
      .from(advancePayments)
      .where(whereClause)

    return NextResponse.json({
      payments: paymentsData,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
      statistics: stats[0],
    })
  } catch (error) {
    console.error("Error fetching advance payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/financial/advance-payments - Create new advance payment
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const {
      tpaId,
      amount,
      paymentReference,
      paymentDate,
      paymentMethod,
      bankDetails,
      description,
      purpose,
      status = "pending"
    } = body

    // Validate required fields
    if (!tpaId || !amount || !paymentReference || !paymentDate || !paymentMethod || !purpose) {
      return NextResponse.json(
        { error: "TPA, amount, payment reference, date, method, and purpose are required" },
        { status: 400 }
      )
    }

    // Check if payment reference already exists
    const existingPayment = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.paymentReference, paymentReference))
      .limit(1)

    if (existingPayment.length > 0) {
      return NextResponse.json(
        { error: "Payment reference already exists" },
        { status: 400 }
      )
    }

    // Create advance payment
    const newPayment = await db
      .insert(advancePayments)
      .values({
        tpaId: parseInt(tpaId),
        amount: amount.toString(),
        paymentReference,
        paymentDate,
        paymentMethod,
        bankDetails: bankDetails ? JSON.stringify(bankDetails) : null,
        description,
        purpose,
        status,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({
      message: "Advance payment created successfully",
      payment: newPayment[0],
    })
  } catch (error) {
    console.error("Error creating advance payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}