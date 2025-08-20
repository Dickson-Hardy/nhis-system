import { NextResponse } from "next/server"
import { db, users } from "@/lib/db"

export async function GET() {
  try {
    // Get all users with their tpaId and facilityId
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tpaId: users.tpaId,
      facilityId: users.facilityId,
      isActive: users.isActive,
    }).from(users)

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}