import { type NextRequest, NextResponse } from "next/server"
import { db, tpas, users, facilities } from "@/lib/db"
import { eq, count } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/tpas/[id] - Get specific TPA details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const tpaId = parseInt(params.id)
    if (isNaN(tpaId)) {
      return NextResponse.json({ error: "Invalid TPA ID" }, { status: 400 })
    }

    // Get TPA details
    const tpaData = await db
      .select()
      .from(tpas)
      .where(eq(tpas.id, tpaId))
      .limit(1)

    if (tpaData.length === 0) {
      return NextResponse.json({ error: "TPA not found" }, { status: 404 })
    }

    // Get user count
    const userCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tpaId, tpaId))

    // Get facility count
    const facilityCount = await db
      .select({ count: count() })
      .from(facilities)
      .where(eq(facilities.tpaId, tpaId))

    return NextResponse.json({
      tpa: {
        ...tpaData[0],
        userCount: userCount[0].count,
        facilityCount: facilityCount[0].count,
      },
    })
  } catch (error) {
    console.error("Error fetching TPA:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/tpas/[id] - Update TPA
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const tpaId = parseInt(params.id)
    if (isNaN(tpaId)) {
      return NextResponse.json({ error: "Invalid TPA ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, code, contactEmail, contactPhone, address, isActive } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const updatedTpa = await db
      .update(tpas)
      .set({
        name,
        code,
        contactEmail,
        contactPhone,
        address,
        isActive,
      })
      .where(eq(tpas.id, tpaId))
      .returning()

    if (updatedTpa.length === 0) {
      return NextResponse.json({ error: "TPA not found" }, { status: 404 })
    }

    return NextResponse.json({ tpa: updatedTpa[0] })
  } catch (error) {
    console.error("Error updating TPA:", error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: "TPA code already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/tpas/[id] - Delete TPA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const tpaId = parseInt(params.id)
    if (isNaN(tpaId)) {
      return NextResponse.json({ error: "Invalid TPA ID" }, { status: 400 })
    }

    // Check if TPA has associated users or facilities
    const userCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tpaId, tpaId))

    const facilityCount = await db
      .select({ count: count() })
      .from(facilities)
      .where(eq(facilities.tpaId, tpaId))

    if (userCount[0].count > 0 || facilityCount[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete TPA with associated users or facilities. Deactivate instead." },
        { status: 400 }
      )
    }

    const deletedTpa = await db
      .delete(tpas)
      .where(eq(tpas.id, tpaId))
      .returning()

    if (deletedTpa.length === 0) {
      return NextResponse.json({ error: "TPA not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "TPA deleted successfully" })
  } catch (error) {
    console.error("Error deleting TPA:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}