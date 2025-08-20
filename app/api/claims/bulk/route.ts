import { type NextRequest, NextResponse } from "next/server"
import { db, claims } from "@/lib/db"
import { inArray } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// POST /api/claims/bulk - Bulk create claims (for Excel upload)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { claims: claimsData } = await request.json()

    if (!Array.isArray(claimsData) || claimsData.length === 0) {
      return NextResponse.json({ error: "Invalid claims data" }, { status: 400 })
    }

    const claimsToInsert = claimsData.map((claim: any) => ({
      ...claim,
      createdBy: user.id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const insertedClaims = await db.insert(claims).values(claimsToInsert).returning()

    return NextResponse.json({
      message: `Successfully created ${insertedClaims.length} claims`,
      claims: insertedClaims,
    })
  } catch (error) {
    console.error("Error bulk creating claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/claims/bulk - Bulk update claims status
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { claimIds, updates } = await request.json()

    if (!Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json({ error: "Invalid claim IDs" }, { status: 400 })
    }

    const updatedClaims = await db
      .update(claims)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(inArray(claims.id, claimIds))
      .returning()

    return NextResponse.json({
      message: `Successfully updated ${updatedClaims.length} claims`,
      claims: updatedClaims,
    })
  } catch (error) {
    console.error("Error bulk updating claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
