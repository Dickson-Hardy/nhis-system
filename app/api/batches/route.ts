import { type NextRequest, NextResponse } from "next/server"
import { db, batches, tpas, users } from "@/lib/db"
import { eq, and, desc, asc, ilike, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/batches - Fetch batches with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const tpaId = searchParams.get("tpaId")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build where conditions based on user role and filters
    const whereConditions: any[] = []

    // Role-based filtering
    if (user.role === "tpa" && user.tpaId) {
      whereConditions.push(eq(batches.tpaId, user.tpaId))
    }

    // Additional filters
    if (status) {
      whereConditions.push(eq(batches.status, status))
    }
    if (tpaId && user.role === "nhis_admin") {
      const parsedTpaId = Number.parseInt(tpaId)
      if (!isNaN(parsedTpaId)) {
        whereConditions.push(eq(batches.tpaId, parsedTpaId))
      }
    }

    // Search functionality
    if (search) {
      whereConditions.push(ilike(batches.batchNumber, `%${search}%`))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const batchesData = await db
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
        },
      })
      .from(batches)
      .leftJoin(tpas, eq(batches.tpaId, tpas.id))
      .where(whereClause)
      .orderBy(
        sortOrder === "desc"
          ? desc(
              sortBy === "id" ? batches.id :
              sortBy === "batchNumber" ? batches.batchNumber :
              sortBy === "totalClaims" ? batches.totalClaims :
              sortBy === "totalAmount" ? batches.totalAmount :
              sortBy === "status" ? batches.status :
              sortBy === "submittedAt" ? batches.submittedAt :
              sortBy === "reviewedAt" ? batches.reviewedAt :
              batches.createdAt
            )
          : asc(
              sortBy === "id" ? batches.id :
              sortBy === "batchNumber" ? batches.batchNumber :
              sortBy === "totalClaims" ? batches.totalClaims :
              sortBy === "totalAmount" ? batches.totalAmount :
              sortBy === "status" ? batches.status :
              sortBy === "submittedAt" ? batches.submittedAt :
              sortBy === "reviewedAt" ? batches.reviewedAt :
              batches.createdAt
            ),
      )
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCount = await db.select({ count: count() }).from(batches).where(whereClause)

    return NextResponse.json({
      batches: batchesData,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/batches - Create new batch
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get fresh user data from database to ensure we have tpaId/facilityId
    const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
    if (dbUser.length === 0 || !dbUser[0].isActive) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 })
    }

    const currentUser = {
      id: dbUser[0].id,
      email: dbUser[0].email,
      name: dbUser[0].name,
      role: dbUser[0].role as "tpa" | "facility" | "nhis_admin",
      tpaId: dbUser[0].tpaId,
      facilityId: dbUser[0].facilityId,
    }

    // Debug: Log user details
    console.log("User attempting to create batch:", {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      tpaId: currentUser.tpaId,
      facilityId: currentUser.facilityId
    })

    // Allow TPA users and NHIS admins to create batches
    if (currentUser.role !== "tpa" && currentUser.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Only TPA users and NHIS admins can create batches" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.batchNumber || !body.batchNumber.trim()) {
      return NextResponse.json({ error: "Batch number is required" }, { status: 400 })
    }

    if (!body.facilityId) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
    }

    // For TPA users, use their tpaId, for admins, require tpaId in request
    let tpaId: number
    if (currentUser.role === "tpa") {
      if (!currentUser.tpaId) {
        console.error("TPA user missing tpaId in database:", currentUser)
        return NextResponse.json({ error: "TPA user must have tpaId assigned in database" }, { status: 403 })
      }
      tpaId = currentUser.tpaId
    } else {
      // NHIS admin case
      if (!body.tpaId) {
        return NextResponse.json({ error: "TPA ID is required for admin users" }, { status: 400 })
      }
      tpaId = body.tpaId
    }

    // Generate batch number if not provided
    const batchNumber = body.batchNumber.trim()

    const newBatch = await db
      .insert(batches)
      .values({
        batchNumber,
        tpaId,
        totalClaims: 0,
        totalAmount: "0",
        status: "draft",
        createdBy: currentUser.id,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ batch: newBatch[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating batch:", error)
    
    // Handle unique constraint violation for batch number
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: "Batch number already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
