import { type NextRequest, NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

// PUT /api/users/[id]/activate - Activate/Deactivate user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { isActive } = await request.json()

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 })
    }

    // Prevent admin from deactivating themselves
    if (user.id === userId && !isActive) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 })
    }

    const updatedUser = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
      })

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Send notification to user
    await sendNotification({
      type: isActive ? "account_activated" : "account_deactivated",
      recipientEmail: updatedUser[0].email,
      data: {
        userName: updatedUser[0].name,
      },
    })

    return NextResponse.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser[0],
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
