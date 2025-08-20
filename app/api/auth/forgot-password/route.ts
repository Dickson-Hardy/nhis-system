import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { generatePasswordResetToken } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    // Always return success to prevent email enumeration attacks
    if (user.length === 0) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      })
    }

    const userData = user[0]

    if (!userData.isActive) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      })
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token to database
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userData.id))

    // Send password reset email
    await sendNotification({
      type: "password_reset",
      recipientEmail: userData.email,
      data: {
        userName: userData.name,
        resetToken,
      },
    })

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent."
    })
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}