import { NextResponse } from "next/server"
import { notificationService } from "@/lib/notifications"

export async function POST() {
  try {
    // Test claim status notification
    await notificationService.notifyClaimStatusChange(1, "approved", 1, undefined)

    // Test batch status notification
    await notificationService.notifyBatchStatusChange(1, "approved")

    return NextResponse.json({ message: "Test notifications sent successfully" })
  } catch (error) {
    console.error("Failed to send test notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
