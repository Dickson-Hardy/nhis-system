import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { claimItems, claimItemSummaries } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET /api/claims/[claimId]/items - Get all items for a claim
export async function GET(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const claimId = parseInt(params.claimId)

    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 })
    }

    // Get claim items
    const items = await db
      .select()
      .from(claimItems)
      .where(eq(claimItems.claimId, claimId))
      .orderBy(desc(claimItems.createdAt))

    // Get summary if it exists
    const summary = await db
      .select()
      .from(claimItemSummaries)
      .where(eq(claimItemSummaries.claimId, claimId))
      .limit(1)

    return NextResponse.json({
      items,
      summary: summary[0] || null,
      totalItems: items.length,
      totalAmount: items.reduce((sum, item) => sum + (parseFloat(item.totalCost?.toString() || "0")), 0)
    })

  } catch (error) {
    console.error("Error fetching claim items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/claims/[claimId]/items - Add new item to claim
export async function POST(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only facilities can add items to their claims
    if (user.role !== "facility") {
      return NextResponse.json({ error: "Only facilities can add claim items" }, { status: 403 })
    }

    const claimId = parseInt(params.claimId)
    const body = await request.json()

    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 })
    }

    const {
      itemType,
      itemCategory,
      itemName,
      itemDescription,
      itemCode,
      quantity,
      unit,
      dosage,
      duration,
      unitCost,
      totalCost,
      serviceDate,
      prescribedDate,
      prescribedBy,
      indication,
      urgency,
      supportingDocuments,
      prescriptionUrl,
      labResultUrl
    } = body

    // Validate required fields
    if (!itemType || !itemName || !unitCost || !totalCost) {
      return NextResponse.json({ 
        error: "Missing required fields: itemType, itemName, unitCost, totalCost" 
      }, { status: 400 })
    }

    // Insert new item
    const [newItem] = await db
      .insert(claimItems)
      .values({
        claimId: claimId,
        itemType: itemType,
        itemCategory: itemCategory || null,
        itemName: itemName,
        itemDescription: itemDescription || null,
        itemCode: itemCode || null,
        quantity: quantity || 1,
        unit: unit || null,
        dosage: dosage || null,
        duration: duration || null,
        unitCost: unitCost.toString(),
        totalCost: totalCost.toString(),
        serviceDate: serviceDate ? new Date(serviceDate) : null,
        prescribedDate: prescribedDate ? new Date(prescribedDate) : null,
        prescribedBy: prescribedBy || null,
        indication: indication || null,
        urgency: urgency || null,
        supportingDocuments: supportingDocuments || null,
        prescriptionUrl: prescriptionUrl || null,
        labResultUrl: labResultUrl || null,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)
      .returning()

    return NextResponse.json({ 
      success: true, 
      item: newItem 
    }, { status: 201 })

  } catch (error) {
    console.error("Error adding claim item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}