import { type NextRequest, NextResponse } from "next/server"
import { db, facilities } from "@/lib/db"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { sendNotification } from "@/lib/notifications"

// PUT /api/facilities/[id]/activate - Activate/Deactivate facility
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
    const { isActive } = await request.json()

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 })
    }

    const updatedFacility = await db
      .update(facilities)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(facilities.id, facilityId))
      .returning()

    if (updatedFacility.length === 0) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    // Send notification to facility
    if (updatedFacility[0].contactEmail) {
      await sendNotification({
        type: isActive ? "facility_activated" : "facility_deactivated",
        recipientEmail: updatedFacility[0].contactEmail,
        data: {
          facilityName: updatedFacility[0].name,
        },
      })
    }

    return NextResponse.json({
      message: `Facility ${isActive ? "activated" : "deactivated"} successfully`,
      facility: updatedFacility[0],
    })
  } catch (error) {
    console.error("Error updating facility status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
