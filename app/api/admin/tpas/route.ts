import { type NextRequest, NextResponse } from "next/server"
import { db, tpas, users } from "@/lib/db"
import { eq, desc, ilike, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/tpas - Fetch all TPAs (Admin only)
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

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []
    if (search) {
      whereConditions.push(ilike(tpas.name, `%${search}%`))
    }

    const whereClause = whereConditions.length > 0 ? whereConditions[0] : undefined

    // Fetch TPAs with user count
    const tpasData = await db
      .select({
        id: tpas.id,
        name: tpas.name,
        code: tpas.code,
        contactEmail: tpas.contactEmail,
        contactPhone: tpas.contactPhone,
        address: tpas.address,
        isActive: tpas.isActive,
        createdAt: tpas.createdAt,
      })
      .from(tpas)
      .where(whereClause)
      .orderBy(desc(tpas.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCount = await db.select({ count: count() }).from(tpas).where(whereClause)

    // Get user counts for each TPA
    const tpasWithCounts = await Promise.all(
      tpasData.map(async (tpa) => {
        const userCount = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.tpaId, tpa.id))

        return {
          ...tpa,
          userCount: userCount[0].count,
        }
      })
    )

    return NextResponse.json({
      tpas: tpasWithCounts,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching TPAs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/tpas - Create new TPA (Admin only)
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
    const { name, code, contactEmail, contactPhone, address } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const newTpa = await db
      .insert(tpas)
      .values({
        name,
        code,
        contactEmail,
        contactPhone,
        address,
        isActive: true,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ tpa: newTpa[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating TPA:", error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: "TPA code already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}