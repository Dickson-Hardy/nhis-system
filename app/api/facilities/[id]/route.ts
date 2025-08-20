import { type NextRequest, NextResponse } from "next/server"
import { db, facilities, tpas, claims } from "@/lib/db"
import { eq, count, sum } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// GET /api/facilities/[id] - Get specific facility with statistics
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

    const facilityId = Number.parseInt(params.id)

    const facilityData = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        code: facilities.code,
        state: facilities.state,
        address: facilities.address,
        contactEmail: facilities.contactEmail,
        contactPhone: facilities.contactPhone,
        isActive: facilities.isActive,
        createdAt: facilities.createdAt,
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
          contactEmail: tpas.contactEmail,
          contactPhone: tpas.contactPhone,
        },
      })
      .from(facilities)
      .leftJoin(tpas, eq(facilities.tpaId, tpas.id))
      .where(eq(facilities.id, facilityId))

    if (facilityData.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    const facility = facilityData[0]

    // Role-based access control
    if (user.role === "tpa" && facility.tpa?.id !== user.tpaId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    if (user.role === "facility" && facility.id !== user.facilityId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get facility statistics
    const facilityStats = await db
      .select({
        totalClaims: count(),
        totalAmount: sum(claims.totalCostOfCare),
        approvedAmount: sum(claims.approvedCostOfCare),
      })
      .from(claims)
      .where(eq(claims.facilityId, facilityId))

    // Get claims by status
    const claimsByStatus = await db
      .select({
        status: claims.status,
        count: count(),
      })
      .from(claims)
      .where(eq(claims.facilityId, facilityId))
      .groupBy(claims.status)

    return NextResponse.json({
      facility: {
        ...facility,
        statistics: {
          ...facilityStats[0],
          claimsByStatus,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching facility:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/facilities/[id] - Update facility
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

    const facilityId = Number.parseInt(params.id)
    const body = await request.json()

    // Check if facility code is being changed and if it already exists
    if (body.code) {
      const existingFacility = await db.select().from(facilities).where(eq(facilities.code, body.code))

      if (existingFacility.length > 0 && existingFacility[0].id !== facilityId) {
        return NextResponse.json({ error: "Facility code already exists" }, { status: 400 })
      }
    }

    const updatedFacility = await db
      .update(facilities)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(facilities.id, facilityId))
      .returning()

    if (updatedFacility.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    return NextResponse.json({ facility: updatedFacility[0] })
  } catch (error) {
    console.error("Error updating facility:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/facilities/[id] - Delete facility
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

    const facilityId = Number.parseInt(params.id)

    // Check if facility has claims
    const facilityClaimsCount = await db
      .select({ count: count() })
      .from(claims)
      .where(eq(claims.facilityId, facilityId))

    if (facilityClaimsCount[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete facility with existing claims. Deactivate instead." },
        { status: 400 },
      )
    }

    const deletedFacility = await db.delete(facilities).where(eq(facilities.id, facilityId)).returning()

    if (deletedFacility.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Facility deleted successfully" })
  } catch (error) {
    console.error("Error deleting facility:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
