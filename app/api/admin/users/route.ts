import { NextRequest, NextResponse } from "next/server"
import { eq, ilike, and, or, sql, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, tpas, facilities } from "@/lib/db/schema"
import { verifyToken, generateTemporaryPassword, hashPassword } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "nhis_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      )
    }

    if (role) {
      conditions.push(eq(users.role, role))
    }

    if (status === "active") {
      conditions.push(eq(users.isActive, true))
    } else if (status === "inactive") {
      conditions.push(eq(users.isActive, false))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get users with related TPA and facility data
    const usersData = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
          state: facilities.state,
        },
      })
      .from(users)
      .leftJoin(tpas, eq(users.tpaId, tpas.id))
      .leftJoin(facilities, eq(users.facilityId, facilities.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)

    const total = totalResult[0].count
    const totalPages = Math.ceil(total / limit)

    // Get statistics
    const statsResult = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`sum(case when ${users.isActive} = true then 1 else 0 end)`,
        inactiveUsers: sql<number>`sum(case when ${users.isActive} = false then 1 else 0 end)`,
        tpaUsers: sql<number>`sum(case when ${users.role} = 'tpa' then 1 else 0 end)`,
        facilityUsers: sql<number>`sum(case when ${users.role} = 'facility' then 1 else 0 end)`,
        adminUsers: sql<number>`sum(case when ${users.role} = 'nhis_admin' then 1 else 0 end)`,
      })
      .from(users)

    const statistics = statsResult[0]

    return NextResponse.json({
      users: usersData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      statistics,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "nhis_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, role, name, tpaId, facilityId, useTemporaryPassword = true } = body

    // Validate required fields
    if (!email || !role || !name) {
      return NextResponse.json(
        { error: "Email, role, and name are required" },
        { status: 400 }
      )
    }

    // If not using temporary password, validate that password is provided
    if (!useTemporaryPassword && !password) {
      return NextResponse.json(
        { error: "Password is required when not using temporary password" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["tpa", "facility", "nhis_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be tpa, facility, or nhis_admin" },
        { status: 400 }
      )
    }

    // Validate TPA/Facility requirements
    if (role === "tpa" && !tpaId) {
      return NextResponse.json(
        { error: "TPA ID is required for TPA users" },
        { status: 400 }
      )
    }

    if (role === "facility" && !facilityId) {
      return NextResponse.json(
        { error: "Facility ID is required for facility users" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Generate password - either provided or temporary
    let finalPassword: string
    let isTemporary = false

    if (useTemporaryPassword) {
      finalPassword = await generateTemporaryPassword()
      isTemporary = true
    } else {
      finalPassword = password
      isTemporary = false
    }

    // Hash password
    const hashedPassword = await hashPassword(finalPassword)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role,
        name,
        tpaId: role === "tpa" ? tpaId : null,
        facilityId: role === "facility" ? facilityId : null,
        isActive: true,
        isTemporaryPassword: isTemporary,
        lastPasswordChange: isTemporary ? null : new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        isActive: users.isActive,
        isTemporaryPassword: users.isTemporaryPassword,
        createdAt: users.createdAt,
      })

    // Send welcome notification with credentials if using temporary password
    if (isTemporary) {
      await sendNotification({
        type: "welcome_with_credentials",
        recipientEmail: email,
        data: {
          userName: name,
          userRole: role,
          temporaryPassword: finalPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        },
      })
    } else {
      // Send regular welcome notification
      await sendNotification({
        type: "welcome",
        recipientEmail: email,
        data: {
          userName: name,
          userRole: role,
        },
      })
    }

    return NextResponse.json({
      message: "User created successfully",
      user: newUser[0],
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "nhis_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, action, ...updateData } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs are required" },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case "activate":
        result = await db
          .update(users)
          .set({ isActive: true, updatedAt: new Date() })
          .where(sql`${users.id} = ANY(${userIds})`)
          .returning({ id: users.id })
        break

      case "deactivate":
        result = await db
          .update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(sql`${users.id} = ANY(${userIds})`)
          .returning({ id: users.id })
        break

      case "update":
        // For individual user update
        if (userIds.length !== 1) {
          return NextResponse.json(
            { error: "Update action requires exactly one user ID" },
            { status: 400 }
          )
        }

        const updateFields: any = { updatedAt: new Date() }
        
        if (updateData.name) updateFields.name = updateData.name
        if (updateData.email) updateFields.email = updateData.email
        if (updateData.role) updateFields.role = updateData.role
        if (updateData.tpaId !== undefined) updateFields.tpaId = updateData.tpaId
        if (updateData.facilityId !== undefined) updateFields.facilityId = updateData.facilityId
        if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive

        // Hash new password if provided
        if (updateData.password) {
          updateFields.password = await bcrypt.hash(updateData.password, 12)
        }

        result = await db
          .update(users)
          .set(updateFields)
          .where(eq(users.id, userIds[0]))
          .returning({ id: users.id })
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${result.length} user(s)`,
      affectedUsers: result.length,
    })
  } catch (error) {
    console.error("Error updating users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}