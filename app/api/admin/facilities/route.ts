import { type NextRequest, NextResponse } from "next/server"
import { db, facilities, tpas, users } from "@/lib/db"
import { eq, desc, ilike, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/facilities - Fetch all facilities (Admin only)
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
    const tpaId = searchParams.get("tpaId")

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []
    if (search) {
      whereConditions.push(ilike(facilities.name, `%${search}%`))
    }
    if (tpaId) {
      whereConditions.push(eq(facilities.tpaId, parseInt(tpaId)))
    }

    const whereClause = whereConditions.length > 0 ? whereConditions[0] : undefined

    // Fetch facilities with TPA information
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
      .orderBy(desc(facilities.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCount = await db.select({ count: count() }).from(facilities).where(whereClause)

    // Get user counts for each facility
    const facilitiesWithCounts = await Promise.all(
      facilitiesData.map(async (facility) => {
        const userCount = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.facilityId, facility.id))

        return {
          ...facility,
          userCount: userCount[0].count,
        }
      })
    )

    return NextResponse.json({
      facilities: facilitiesWithCounts,
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

// POST /api/admin/facilities - Create new facility (Admin only)
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
    const { name, code, state, address, contactEmail, contactPhone, tpaId } = body

    // Validate required fields
    if (!name || !code || !state) {
      return NextResponse.json({ error: "Name, code, and state are required" }, { status: 400 })
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
        tpaId: tpaId || null,
        isActive: true,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ facility: newFacility[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating facility:", error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: "Facility code already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}