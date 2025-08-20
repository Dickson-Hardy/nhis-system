import { type NextRequest, NextResponse } from "next/server"
import { db, facilities, tpas } from "@/lib/db"
import { eq, and, desc, asc, ilike, or, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/facilities - Fetch facilities with filtering and pagination
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
    if (user.role === "tpa" && user.tpaId) {
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
        sortOrder === "desc" ? desc(facilities.createdAt) : asc(facilities.createdAt)
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
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Allow both TPA users and admins to create facilities
    if (user.role !== "nhis_admin" && user.role !== "tpa") {
      return NextResponse.json({ error: "Access denied - Admin or TPA role required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, state, address, contactEmail, contactPhone, tpaId } = body

    // Validate required fields
    if (!name || !state) {
      return NextResponse.json({ error: "Name and state are required" }, { status: 400 })
    }

    // Determine TPA ID based on user role
    let finalTpaId = tpaId
    if (user.role === "tpa") {
      // TPA users can only create facilities for their own TPA
      finalTpaId = user.tpaId
      if (!finalTpaId) {
        return NextResponse.json({ error: "TPA ID is required for TPA users" }, { status: 400 })
      }
    } else if (user.role === "nhis_admin") {
      // Admins can create facilities for any TPA
      if (!tpaId) {
        return NextResponse.json({ error: "TPA ID is required for admin users" }, { status: 400 })
      }
      finalTpaId = tpaId
    }

    if (!finalTpaId) {
      return NextResponse.json({ error: "TPA ID is required" }, { status: 400 })
    }

    // Generate facility code if not provided
    const facilityCode = code || `FAC-${finalTpaId}-${Date.now().toString().slice(-6)}`

    // Check if facility code already exists
    const existingFacility = await db.select().from(facilities).where(eq(facilities.code, facilityCode))
    if (existingFacility.length > 0) {
      return NextResponse.json({ error: "Facility code already exists" }, { status: 400 })
    }

    // Check if facility with same name exists for this TPA
    const existingFacilityByName = await db
      .select()
      .from(facilities)
      .where(and(eq(facilities.name, name), eq(facilities.tpaId, finalTpaId)))
    if (existingFacilityByName.length > 0) {
      return NextResponse.json({ 
        error: "Facility with this name already exists for this TPA",
        existingFacility: existingFacilityByName[0]
      }, { status: 409 })
    }

    // Verify TPA exists
    const tpaExists = await db.select().from(tpas).where(eq(tpas.id, finalTpaId))
    if (tpaExists.length === 0) {
      return NextResponse.json({ error: "TPA not found" }, { status: 400 })
    }

    const newFacility = await db
      .insert(facilities)
      .values({
        name,
        code: facilityCode,
        state,
        address: address || "",
        contactEmail: contactEmail || "",
        contactPhone: contactPhone || "",
        tpaId: finalTpaId,
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
