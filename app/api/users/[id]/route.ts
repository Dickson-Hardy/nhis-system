import { type NextRequest, NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken, hashPassword } from "@/lib/auth"

// GET /api/users/[id] - Get specific user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = Number.parseInt(params.id)

    // Users can only view their own profile unless they're admin
    if (user.role !== "nhis_admin" && user.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const userData = await db
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
      .where(eq(users.id, userId))

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: userData[0] })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = Number.parseInt(params.id)
    const body = await request.json()

    // Users can only update their own profile unless they're admin
    if (user.role !== "nhis_admin" && user.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Non-admin users can only update certain fields
    const allowedFields =
      user.role === "nhis_admin" ? ["name", "email", "role", "isActive", "password"] : ["name", "password"]

    const updateData: any = { updatedAt: new Date() }

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === "password" && value) {
          updateData[key] = await hashPassword(value as string)
        } else if (key !== "password") {
          updateData[key] = value
        }
      }
    }

    const updatedUser = await db.update(users).set(updateData).where(eq(users.id, userId)).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      name: users.name,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    })

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: updatedUser[0] })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Prevent admin from deleting themselves
    if (user.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const deletedUser = await db.delete(users).where(eq(users.id, userId)).returning()

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
