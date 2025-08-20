import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, tpas, facilities } from "@/lib/db/schema"
import { verifyToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Get user with related TPA and facility data
    const userData = await db
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
      .where(eq(users.id, userId))
      .limit(1)

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: userData[0] })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    const { email, password, role, name, tpaId, facilityId, isActive } = body

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate role if provided
    if (role && !["tpa", "facility", "nhis_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be tpa, facility, or nhis_admin" },
        { status: 400 }
      )
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateFields: any = { updatedAt: new Date() }

    if (email) updateFields.email = email
    if (name) updateFields.name = name
    if (role) updateFields.role = role
    if (tpaId !== undefined) updateFields.tpaId = tpaId
    if (facilityId !== undefined) updateFields.facilityId = facilityId
    if (isActive !== undefined) updateFields.isActive = isActive

    // Hash new password if provided
    if (password) {
      updateFields.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deletion of the current admin user
    if (decoded.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Soft delete by deactivating instead of hard delete to preserve data integrity
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({
      message: "User deactivated successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}