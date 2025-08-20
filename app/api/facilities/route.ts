import { type NextRequest, NextResponse } from "next/server"
import { db, facilities, tpas } from "@/lib/db"
import { eq, and, desc, asc, ilike, or, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/facilities - Fetch facilities with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const state = searchParams.get("state")
    const tpaId = searchParams.get("tpaId")
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build where conditions based on user role and filters
    const whereConditions: any[] = []

    // Role-based filtering
    if (user.role === "tpa") {
      whereConditions.push(eq(facilities.tpaId, user.tpaId))
    }

    // Additional filters
    if (state) {
      whereConditions.push(eq(facilities.state, state))
    }
    if (tpaId && (user.role === "nhis_admin" || user.role === "tpa")) {
      whereConditions.push(eq(facilities.tpaId, Number.parseInt(tpaId)))
    }
    if (isActive !== null && isActive !== undefined) {
      whereConditions.push(eq(facilities.isActive, isActive === "true"))
    }

    // Search functionality
    if (search) {
      whereConditions.push(
        or(
          ilike(facilities.name, `%${search}%`),
          ilike(facilities.code, `%${search}%`),
          ilike(facilities.address, `%${search}%`),
        ),
      )
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const facilitiesData = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        code: facilities.code,
        state: facilities.state,
        address: facilities.address,
        contactEmail: facilities.contactEmail,
        contactPhone: facilities.contactPhone,
        isActive: facilities.isActive,
        createdAt: facilities.createdAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
      })
      .from(facilities)
      .leftJoin(tpas, eq(facilities.tpaId, tpas.id))
      .where(whereClause)
      .orderBy(
        sortOrder === "desc"
          ? desc(facilities[sortBy as keyof typeof facilities])
          : asc(facilities[sortBy as keyof typeof facilities]),
      )
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCount = await db.select({ count: count() }).from(facilities).where(whereClause)

    return NextResponse.json({
      facilities: facilitiesData,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching facilities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facilities - Create new facility
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, state, address, contactEmail, contactPhone, tpaId } = body

    // Validate required fields
    if (!name || !code || !state || !tpaId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if facility code already exists
    const existingFacility = await db.select().from(facilities).where(eq(facilities.code, code))
    if (existingFacility.length > 0) {
      return NextResponse.json({ error: "Facility code already exists" }, { status: 400 })
    }

    // Verify TPA exists
    const tpaExists = await db.select().from(tpas).where(eq(tpas.id, tpaId))
    if (tpaExists.length === 0) {
      return NextResponse.json({ error: "TPA not found" }, { status: 400 })
    }

    const newFacility = await db
      .insert(facilities)
      .values({
        name,
        code,
        state,
        address,
        contactEmail,
        contactPhone,
        tpaId,
        isActive: true,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ facility: newFacility[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating facility:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
