import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and, desc, count, sql } from "drizzle-orm"

// GET /api/facility/notifications - Get facility notifications
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

    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const category = url.searchParams.get("category")
    const read = url.searchParams.get("read") // "true", "false", or undefined for all
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    // Build query conditions
    const conditions = [eq(notifications.facilityId, user.facilityId)]

    if (type) {
      conditions.push(eq(notifications.type, type))
    }

    if (category) {
      conditions.push(eq(notifications.category, category))
    }

    if (read === "true") {
      conditions.push(eq(notifications.isRead, true))
    } else if (read === "false") {
      conditions.push(eq(notifications.isRead, false))
    }

    // Get notifications
    const facilityNotifications = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        category: notifications.category,
        isRead: notifications.isRead,
        actionUrl: notifications.actionUrl,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...conditions))

    // Get unread count
    const unreadCount = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.facilityId, user.facilityId),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({
      notifications: facilityNotifications,
      pagination: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: totalCount[0].count > offset + limit,
      },
      summary: {
        total: totalCount[0].count,
        unread: unreadCount[0].count,
        read: totalCount[0].count - unreadCount[0].count
      }
    })
  } catch (error) {
    console.error("Error fetching facility notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/facility/notifications - Create a new notification (for system use)
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

    if (!user.facilityId) {
      return NextResponse.json({ error: "Facility ID not found" }, { status: 400 })
    }

    const body = await request.json()
    const { title, message, type, category, actionUrl, metadata } = body

    if (!title || !message || !type || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newNotification = await db
      .insert(notifications)
      .values({
        facilityId: user.facilityId,
        title,
        message,
        type,
        category,
        actionUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    return NextResponse.json({
      message: "Notification created successfully",
      notification: newNotification[0]
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/facility/notifications - Mark notifications as read
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
    const { notificationIds, markAllAsRead } = body

    let updateResult

    if (markAllAsRead) {
      // Mark all notifications as read
      updateResult = await db
        .update(notifications)
        .set({
          isRead: true,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(notifications.facilityId, user.facilityId),
            eq(notifications.isRead, false)
          )
        )
        .returning()

      return NextResponse.json({
        message: "All notifications marked as read",
        updatedCount: updateResult.length
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      updateResult = await db
        .update(notifications)
        .set({
          isRead: true,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(notifications.facilityId, user.facilityId),
            sql`${notifications.id} = ANY(${notificationIds})`
          )
        )
        .returning()

      return NextResponse.json({
        message: "Notifications marked as read",
        updatedCount: updateResult.length
      })
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/facility/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url)
    const notificationId = url.searchParams.get("id")
    const deleteAll = url.searchParams.get("deleteAll") === "true"

    let deleteResult

    if (deleteAll) {
      // Delete all notifications for the facility
      deleteResult = await db
        .delete(notifications)
        .where(eq(notifications.facilityId, user.facilityId))
        .returning()

      return NextResponse.json({
        message: "All notifications deleted",
        deletedCount: deleteResult.length
      })
    } else if (notificationId) {
      // Delete specific notification
      deleteResult = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, parseInt(notificationId)),
            eq(notifications.facilityId, user.facilityId)
          )
        )
        .returning()

      if (!deleteResult.length) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Notification deleted successfully",
        deletedNotification: deleteResult[0]
      })
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
