import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { facilities, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

// GET /api/facility/settings - Get facility settings and profile
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    // Get facility profile
    const facilityProfile = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        code: facilities.code,
        address: facilities.address,
        city: facilities.city,
        state: facilities.state,
        phone: facilities.phone,
        email: facilities.email,
        website: facilities.website,
        facilityType: facilities.facilityType,
        nhisNumber: facilities.nhisNumber,
        licenseNumber: facilities.licenseNumber,
        accreditationStatus: facilities.accreditationStatus,
        createdAt: facilities.createdAt,
        updatedAt: facilities.updatedAt
      })
      .from(facilities)
      .where(eq(facilities.id, user.facilityId))
      .limit(1)

    if (!facilityProfile.length) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    // Get user preferences (notification settings, etc.)
    const userPreferences = await db
      .select({
        id: users.id,
        email: users.email,
        notificationPreferences: users.notificationPreferences,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    const settings = {
      profile: facilityProfile[0],
      user: userPreferences[0],
      notificationSettings: {
        claimUpdates: true,
        batchUpdates: true,
        paymentUpdates: true,
        systemAlerts: true,
        emailNotifications: true,
        smsNotifications: false
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching facility settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/facility/settings - Update facility settings
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const { profile, notificationSettings, password } = body

    let updateResults = []

    // Update facility profile if provided
    if (profile) {
      const profileUpdate = await db
        .update(facilities)
        .set({
          name: profile.name,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          updatedAt: new Date()
        })
        .where(eq(facilities.id, user.facilityId))
        .returning()

      updateResults.push({ type: 'profile', success: true, data: profileUpdate[0] })
    }

    // Update notification preferences if provided
    if (notificationSettings) {
      const notificationUpdate = await db
        .update(users)
        .set({
          notificationPreferences: JSON.stringify(notificationSettings),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning()

      updateResults.push({ type: 'notifications', success: true, data: notificationUpdate[0] })
    }

    // Update password if provided
    if (password && password.current && password.new) {
      // Verify current password
      const currentUser = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (!currentUser.length) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isCurrentPasswordValid = await bcrypt.compare(password.current, currentUser[0].password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(password.new, 12)

      const passwordUpdate = await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning()

      updateResults.push({ type: 'password', success: true, data: { message: 'Password updated successfully' } })
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      updates: updateResults
    })
  } catch (error) {
    console.error("Error updating facility settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facility/settings/validate-email - Validate email uniqueness
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "facility") {
      return NextResponse.json({ error: "Access denied - Facility only" }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if email is already taken by another facility
    const existingFacility = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(
        and(
          eq(facilities.email, email),
          eq(facilities.id, user.facilityId)
        )
      )
      .limit(1)

    // Check if email is taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.id, user.id)
        )
      )
      .limit(1)

    const isAvailable = !existingFacility.length && !existingUser.length

    return NextResponse.json({
      email,
      isAvailable,
      message: isAvailable ? "Email is available" : "Email is already taken"
    })
  } catch (error) {
    console.error("Error validating email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
