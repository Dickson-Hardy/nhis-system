import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { migrateClaimToItems, migrateFacilityClaims, testMigration } from "@/lib/claim-migration-helper"

// POST /api/claims/migrate - Migrate claims to itemized format
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only facility users can migrate their own claims, or admins can migrate any
    if (user.role !== "facility" && user.role !== "nhis_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { action, facilityId, claimId, testOnly = false } = body

    // Determine which facility to migrate
    let targetFacilityId = facilityId
    if (user.role === "facility") {
      // Facility users can only migrate their own claims
      targetFacilityId = user.facilityId
    }

    if (!targetFacilityId) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
    }

    switch (action) {
      case 'test':
        // Test migration without actually inserting data
        const testResult = await testMigration(targetFacilityId, 10)
        return NextResponse.json({
          success: true,
          type: 'test',
          ...testResult
        })

      case 'migrate_single':
        // Migrate a single claim
        if (!claimId) {
          return NextResponse.json({ error: "Claim ID is required for single migration" }, { status: 400 })
        }

        // Get claim details (would need to implement this)
        // For now, return error
        return NextResponse.json({ error: "Single claim migration not implemented yet" }, { status: 501 })

      case 'migrate_facility':
        // Migrate all claims for a facility
        if (testOnly) {
          const testResult = await testMigration(targetFacilityId, 50)
          return NextResponse.json({
            success: true,
            type: 'test',
            facilityId: targetFacilityId,
            ...testResult
          })
        }

        const migrationResult = await migrateFacilityClaims(targetFacilityId)
        return NextResponse.json({
          success: true,
          type: 'migration',
          facilityId: targetFacilityId,
          ...migrationResult
        })

      default:
        return NextResponse.json({ error: "Invalid action. Use 'test', 'migrate_single', or 'migrate_facility'" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in claims migration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}