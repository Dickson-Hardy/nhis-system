import { type NextRequest, NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { eq, and, desc, asc, ilike, or, count } from "drizzle-orm"
import { verifyToken, hashPassword } from "@/lib/auth"

// GET /api/users - Fetch users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const role = searchParams.get("role")
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any[] = []

    if (role) {
      whereConditions.push(eq(users.role, role))
    }
    if (isActive !== null && isActive !== undefined) {
      whereConditions.push(eq(users.isActive, isActive === "true"))
    }

    // Search functionality
    if (search) {
      whereConditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const usersData = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(
        sortOrder === "desc" ? desc(users[sortBy as keyof typeof users]) : asc(users[sortBy as keyof typeof users]),
      )
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCount = await db.select({ count: count() }).from(users).where(whereClause)

    return NextResponse.json({
      users: usersData,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Create new user
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
    const { email, password, role, name, tpaId, facilityId } = body

    // Validate required fields
    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role-specific requirements
    if (role === "tpa" && !tpaId) {
      return NextResponse.json({ error: "TPA ID is required for TPA users" }, { status: 400 })
    }
    if (role === "facility" && !facilityId) {
      return NextResponse.json({ error: "Facility ID is required for facility users" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email))
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role,
        name,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })

    return NextResponse.json({ user: newUser[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
