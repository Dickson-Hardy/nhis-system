import { EmailService, type ClaimNotificationData, type BatchNotificationData } from "./email"
import { db } from "./db"
import { users, claims, batches } from "./db/schema"
import { eq } from "drizzle-orm"

export class NotificationService {
  private emailService: EmailService

  constructor() {
    this.emailService = EmailService.getInstance()
  }

  async notifyClaimStatusChange(claimId: number, newStatus: string, reviewerId?: number, reason?: string) {
    try {
      // Get claim details
      const claim = await db
        .select({
          id: claims.id,
          uniqueClaimId: claims.uniqueClaimId,
          beneficiaryName: claims.beneficiaryName,
          totalCostOfCare: claims.totalCostOfCare,
          facilityName: claims.facilityId, // Would need to join with facilities table
          tpaName: claims.tpaId, // Would need to join with tpas table
          createdBy: claims.createdBy,
        })
        .from(claims)
        .where(eq(claims.id, claimId))
        .limit(1)

      if (claim.length === 0) {
        console.error("Claim not found:", claimId)
        return
      }

      const claimData = claim[0]

      // Get claim creator details
      const creator = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, claimData.createdBy!))
        .limit(1)

      if (creator.length === 0) {
        console.error("Claim creator not found")
        return
      }

      // Get reviewer details if available
      let reviewerName = undefined
      if (reviewerId) {
        const reviewer = await db.select({ name: users.name }).from(users).where(eq(users.id, reviewerId)).limit(1)

        if (reviewer.length > 0) {
          reviewerName = reviewer[0].name
        }
      }

      const notificationData: ClaimNotificationData = {
        claimId: claimData.uniqueClaimId,
        beneficiaryName: claimData.beneficiaryName,
        facilityName: "Healthcare Facility", // Would be populated from join
        tpaName: "TPA Name", // Would be populated from join
        amount: Number(claimData.totalCostOfCare),
        status: newStatus as any,
        reason,
        reviewerName,
        dateProcessed: new Date().toLocaleDateString(),
      }

      await this.emailService.sendClaimStatusNotification(creator[0].email, creator[0].name, notificationData)

      console.log(`Notification sent for claim ${claimData.uniqueClaimId} status change to ${newStatus}`)
    } catch (error) {
      console.error("Failed to send claim status notification:", error)
    }
  }

  async notifyBatchStatusChange(batchId: number, newStatus: string) {
    try {
      // Get batch details
      const batch = await db
        .select({
          id: batches.id,
          batchNumber: batches.batchNumber,
          totalClaims: batches.totalClaims,
          totalAmount: batches.totalAmount,
          createdBy: batches.createdBy,
          createdAt: batches.createdAt,
          tpaId: batches.tpaId,
        })
        .from(batches)
        .where(eq(batches.id, batchId))
        .limit(1)

      if (batch.length === 0) {
        console.error("Batch not found:", batchId)
        return
      }

      const batchData = batch[0]

      // Get batch creator details
      const creator = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, batchData.createdBy!))
        .limit(1)

      if (creator.length === 0) {
        console.error("Batch creator not found")
        return
      }

      const notificationData: BatchNotificationData = {
        batchNumber: batchData.batchNumber,
        tpaName: "TPA Name", // Would be populated from join
        totalClaims: batchData.totalClaims || 0,
        totalAmount: Number(batchData.totalAmount) || 0,
        status: newStatus as any,
        submittedDate: batchData.createdAt?.toLocaleDateString() || "",
      }

      await this.emailService.sendBatchStatusNotification(creator[0].email, creator[0].name, notificationData)

      console.log(`Notification sent for batch ${batchData.batchNumber} status change to ${newStatus}`)
    } catch (error) {
      console.error("Failed to send batch status notification:", error)
    }
  }

  async sendWelcomeNotification(userId: number) {
    try {
      const user = await db
        .select({
          email: users.email,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        console.error("User not found:", userId)
        return
      }

      const userData = user[0]

      await this.emailService.sendWelcomeEmail(userData.email, userData.name, userData.role)

      console.log(`Welcome notification sent to ${userData.email}`)
    } catch (error) {
      console.error("Failed to send welcome notification:", error)
    }
  }

  async sendPasswordResetNotification(email: string, resetToken: string) {
    try {
      const user = await db
        .select({
          name: users.name,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (user.length === 0) {
        console.error("User not found for password reset:", email)
        return
      }

      await this.emailService.sendPasswordResetEmail(email, user[0].name, resetToken)

      console.log(`Password reset notification sent to ${email}`)
    } catch (error) {
      console.error("Failed to send password reset notification:", error)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

export async function sendNotification({
  type,
  recipientEmail,
  data,
}: {
  type: string
  recipientEmail: string
  data: any
}) {
  try {
    const emailService = EmailService.getInstance()

    switch (type) {
      case "claim_status_change":
        await emailService.sendClaimStatusNotification(recipientEmail, data.userName || "User", {
          claimId: data.claimId,
          beneficiaryName: data.beneficiaryName,
          facilityName: data.facilityName || "Healthcare Facility",
          tpaName: data.tpaName || "TPA",
          amount: data.amount || 0,
          status: data.status,
          reason: data.reason,
          reviewerName: data.reviewerName,
          dateProcessed: new Date().toLocaleDateString(),
        })
        break

      case "batch_submitted":
      case "batch_approved":
      case "batch_rejected":
        const batchStatus = type === "batch_approved" ? "approved" : "rejected"
        await emailService.sendBatchStatusNotification(recipientEmail, data.userName || "User", {
          batchNumber: data.batchNumber,
          tpaName: data.tpaName || "TPA",
          totalClaims: data.totalClaims || 0,
          totalAmount: data.totalAmount || 0,
          status: batchStatus as "approved" | "rejected",
          submittedDate: new Date().toLocaleDateString(),
          reason: data.reason,
          remarks: data.remarks,
        })
        break

      case "welcome":
        await emailService.sendWelcomeEmail(recipientEmail, data.userName, data.userRole || "user")
        break

      case "welcome_with_credentials":
        await emailService.sendWelcomeWithCredentialsEmail(
          recipientEmail, 
          data.userName, 
          data.userRole || "user", 
          data.temporaryPassword,
          data.loginUrl
        )
        break

      case "password_reset":
        await emailService.sendPasswordResetEmail(recipientEmail, data.userName, data.resetToken || data.newPassword)
        break

      case "account_activated":
      case "account_deactivated":
        // For now, send a simple notification - could be expanded with specific templates
        await emailService.sendWelcomeEmail(recipientEmail, data.userName, "user")
        break

      case "facility_activated":
      case "facility_deactivated":
        // For now, send a simple notification - could be expanded with specific templates
        await emailService.sendWelcomeEmail(recipientEmail, data.facilityName || "Facility", "facility")
        break

      default:
        console.warn(`Unknown notification type: ${type}`)
    }

    console.log(`Notification sent: ${type} to ${recipientEmail}`)
  } catch (error) {
    console.error(`Failed to send notification (${type}):`, error)
  }
}
