import { type NextRequest, NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken, hashPassword } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Get user details
    const targetUser = await db.select().from(users).where(eq(users.id, userId))
    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // Send notification to user
    await sendNotification({
      type: "password_reset",
      recipientEmail: targetUser[0].email,
      data: {
        userName: targetUser[0].name,
        newPassword, // In production, don't send the actual password
      },
    })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
