import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Debug: Log user details
    console.log("Current user from /me endpoint:", {
      id: user.id,
      email: user.email,
      role: user.role,
      tpaId: user.tpaId,
      facilityId: user.facilityId
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
