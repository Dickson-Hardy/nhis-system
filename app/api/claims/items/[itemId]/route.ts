import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { claimItems } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// PUT /api/claims/items/[itemId] - Update claim item
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = parseInt(params.itemId)
    const body = await request.json()

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    // Get existing item to check permissions
    const [existingItem] = await db
      .select()
      .from(claimItems)
      .where(eq(claimItems.id, itemId))
      .limit(1)

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check permissions - facilities can only edit their own items
    if (user.role === "facility") {
      // We need to check if this item belongs to their facility
      // For now, we'll allow editing if they created it
      if (existingItem.createdBy !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // For TPA users, they can only update review fields
    let updateData: any = {}

    if (user.role === "tpa") {
      // TPA can only update review-related fields
      const {
        isReviewed,
        reviewStatus,
        reviewNotes,
        approvedQuantity,
        approvedUnitCost,
        approvedTotalCost,
        rejectionReason,
        nhiaStandardCost,
        costVariancePercentage,
        complianceFlag
      } = body

      updateData = {
        isReviewed,
        reviewStatus,
        reviewNotes,
        approvedQuantity,
        approvedUnitCost: approvedUnitCost ? approvedUnitCost.toString() : undefined,
        approvedTotalCost: approvedTotalCost ? approvedTotalCost.toString() : undefined,
        rejectionReason,
        nhiaStandardCost: nhiaStandardCost ? nhiaStandardCost.toString() : undefined,
        costVariancePercentage: costVariancePercentage ? costVariancePercentage.toString() : undefined,
        complianceFlag,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    } else if (user.role === "facility") {
      // Facilities can update item details but not review fields
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

      updateData = {
        itemType,
        itemCategory,
        itemName,
        itemDescription,
        itemCode,
        quantity,
        unit,
        dosage,
        duration,
        unitCost: unitCost ? unitCost.toString() : undefined,
        totalCost: totalCost ? totalCost.toString() : undefined,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        prescribedDate: prescribedDate ? new Date(prescribedDate) : undefined,
        prescribedBy,
        indication,
        urgency,
        supportingDocuments,
        prescriptionUrl,
        labResultUrl,
        updatedAt: new Date()
      }
    } else {
      // Admins can update everything
      updateData = {
        ...body,
        updatedAt: new Date()
      }
      
      // Convert decimal fields to strings for database
      if (updateData.unitCost) updateData.unitCost = updateData.unitCost.toString()
      if (updateData.totalCost) updateData.totalCost = updateData.totalCost.toString()
      if (updateData.approvedUnitCost) updateData.approvedUnitCost = updateData.approvedUnitCost.toString()
      if (updateData.approvedTotalCost) updateData.approvedTotalCost = updateData.approvedTotalCost.toString()
      if (updateData.nhiaStandardCost) updateData.nhiaStandardCost = updateData.nhiaStandardCost.toString()
      if (updateData.costVariancePercentage) updateData.costVariancePercentage = updateData.costVariancePercentage.toString()
      
      // Convert date fields
      if (updateData.serviceDate) updateData.serviceDate = new Date(updateData.serviceDate)
      if (updateData.prescribedDate) updateData.prescribedDate = new Date(updateData.prescribedDate)
      if (updateData.reviewedAt) updateData.reviewedAt = new Date(updateData.reviewedAt)
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Update the item
    const [updatedItem] = await db
      .update(claimItems)
      .set(updateData)
      .where(eq(claimItems.id, itemId))
      .returning()

    return NextResponse.json({ 
      success: true, 
      item: updatedItem 
    })

  } catch (error) {
    console.error("Error updating claim item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/claims/items/[itemId] - Delete claim item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = parseInt(params.itemId)

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    // Get existing item to check permissions
    const [existingItem] = await db
      .select()
      .from(claimItems)
      .where(eq(claimItems.id, itemId))
      .limit(1)

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Only facilities can delete their own items, or admins can delete any
    if (user.role === "facility" && existingItem.createdBy !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (user.role === "tpa") {
      return NextResponse.json({ error: "TPAs cannot delete claim items" }, { status: 403 })
    }

    // Delete the item
    await db
      .delete(claimItems)
      .where(eq(claimItems.id, itemId))

    return NextResponse.json({ 
      success: true,
      message: "Item deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting claim item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}