import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string[]
  subject: string
  html: string
  from?: string
}

export interface ClaimNotificationData {
  claimId: string
  beneficiaryName: string
  facilityName: string
  tpaName: string
  amount: number
  status: "submitted" | "approved" | "rejected" | "pending_review"
  reason?: string
  reviewerName?: string
  dateProcessed?: string
}

export interface BatchNotificationData {
  batchNumber: string
  tpaName: string
  totalClaims: number
  totalAmount: number
  status: "submitted" | "approved" | "rejected"
  submittedDate: string
}

export interface BatchClosureNotificationData {
  batchNumber: string
  tpaName: string
  facilityName: string
  totalClaims: number
  totalAmount: number
  approvedAmount: number
  rejectedAmount: number
  approvedClaims: number
  rejectedClaims: number
  paymentJustification: string
  reviewSummary: string
  forwardingLetterUrl?: string
  submittedDate: string
  tpaSignedBy?: string
}

export class EmailService {
  private static instance: EmailService
  private fromEmail = process.env.FROM_EMAIL || "noreply@nhis.gov.ng"

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const result = await resend.emails.send({
        from: data.from || this.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })

      console.log("Email sent successfully:", result)
      return true
    } catch (error) {
      console.error("Failed to send email:", error)
      return false
    }
  }

  async sendClaimStatusNotification(
    recipientEmail: string,
    recipientName: string,
    claimData: ClaimNotificationData,
  ): Promise<boolean> {
    const template = this.getClaimStatusTemplate(recipientName, claimData)

    return this.sendEmail({
      to: [recipientEmail],
      subject: `Claim ${claimData.status.toUpperCase()}: ${claimData.claimId}`,
      html: template,
    })
  }

  async sendBatchStatusNotification(
    recipientEmail: string,
    recipientName: string,
    batchData: BatchNotificationData,
  ): Promise<boolean> {
    const template = this.getBatchStatusTemplate(recipientName, batchData)

    return this.sendEmail({
      to: [recipientEmail],
      subject: `Batch ${batchData.status.toUpperCase()}: ${batchData.batchNumber}`,
      html: template,
    })
  }

  async sendWelcomeEmail(recipientEmail: string, recipientName: string, role: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(recipientName, role)

    return this.sendEmail({
      to: [recipientEmail],
      subject: "Welcome to NHIS Portal",
      html: template,
    })
  }

  async sendWelcomeWithCredentialsEmail(
    recipientEmail: string, 
    recipientName: string, 
    role: string, 
    temporaryPassword: string,
    loginUrl: string
  ): Promise<boolean> {
    const template = this.getWelcomeWithCredentialsTemplate(recipientName, role, temporaryPassword, loginUrl)

    return this.sendEmail({
      to: [recipientEmail],
      subject: "Welcome to NHIS Portal - Your Account Details",
      html: template,
    })
  }

  async sendPasswordResetEmail(recipientEmail: string, recipientName: string, resetToken: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(recipientName, resetToken)

    return this.sendEmail({
      to: [recipientEmail],
      subject: "Password Reset Request - NHIS Portal",
      html: template,
    })
  }

  async sendBatchClosureNotification(
    recipientEmail: string,
    recipientName: string,
    batchData: BatchClosureNotificationData,
    attachmentUrl?: string
  ): Promise<boolean> {
    const template = this.getBatchClosureTemplate(recipientName, batchData)

    const emailData: EmailData = {
      to: [recipientEmail],
      subject: `Batch Closure Report: ${batchData.batchNumber} - Payment Summary`,
      html: template,
    }

    return this.sendEmail(emailData)
  }

  private getClaimStatusTemplate(recipientName: string, claimData: ClaimNotificationData): string {
    const statusColor = this.getStatusColor(claimData.status)
    const statusMessage = this.getStatusMessage(claimData.status)

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Claim Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">NHIS Portal</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Nigerian Health Insurance Scheme</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Claim Status Update</h2>
            
            <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="margin-bottom: 20px;">${statusMessage}</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Claim Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Claim ID:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.claimId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Beneficiary:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.beneficiaryName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Healthcare Facility:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.facilityName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">TPA:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.tpaName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Amount:</td>
                  <td style="padding: 8px 0; color: #1f2937;">₦${claimData.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Status:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                      ${claimData.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
                ${
                  claimData.reason
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Reason:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.reason}</td>
                </tr>
                `
                    : ""
                }
                ${
                  claimData.reviewerName
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Reviewed by:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${claimData.reviewerName}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                 style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View in Portal
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated message from the NHIS Portal. Please do not reply to this email.</p>
              <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getBatchStatusTemplate(recipientName: string, batchData: BatchNotificationData): string {
    const statusColor = this.getStatusColor(batchData.status)

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">NHIS Portal</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Nigerian Health Insurance Scheme</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Batch Status Update</h2>
            
            <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="margin-bottom: 20px;">Your batch submission has been ${batchData.status}.</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Batch Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Batch Number:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${batchData.batchNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">TPA:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${batchData.tpaName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Total Claims:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${batchData.totalClaims.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Total Amount:</td>
                  <td style="padding: 8px 0; color: #1f2937;">₦${batchData.totalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Submitted Date:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${batchData.submittedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Status:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                      ${batchData.status}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                 style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Batch Details
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated message from the NHIS Portal. Please do not reply to this email.</p>
              <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getWelcomeTemplate(recipientName: string, role: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to NHIS Portal</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Welcome to NHIS Portal</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Nigerian Health Insurance Scheme</p>
            </div>
            
            <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="margin-bottom: 20px;">Welcome to the NHIS Portal! Your account has been successfully created with ${role} access.</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Getting Started</h3>
              <ul style="color: #1f2937; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Log in to your portal using your credentials</li>
                <li style="margin-bottom: 10px;">Complete your profile setup</li>
                <li style="margin-bottom: 10px;">Explore the dashboard and available features</li>
                <li style="margin-bottom: 10px;">Contact support if you need assistance</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                 style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Portal
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>If you have any questions, please contact our support team.</p>
              <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getWelcomeWithCredentialsTemplate(
    recipientName: string, 
    role: string, 
    temporaryPassword: string, 
    loginUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to NHIS Portal - Your Account Details</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Welcome to NHIS Portal</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Nigerian Health Insurance Scheme</p>
            </div>
            
            <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="margin-bottom: 20px;">Welcome to the NHIS Portal! Your account has been successfully created with ${role} access.</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Your Login Credentials</h3>
              <p style="margin: 10px 0; font-weight: bold;">Login URL: <a href="${loginUrl}" style="color: #059669;">${loginUrl}</a></p>
              <p style="margin: 10px 0; font-weight: bold;">Temporary Password: <span style="color: #dc2626; font-family: monospace; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</span></p>
              <p style="margin: 15px 0 0 0; color: #dc2626; font-weight: bold; font-size: 14px;">⚠️ You must change this password on your first login for security reasons.</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Getting Started</h3>
              <ol style="color: #1f2937; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Click the login button below</li>
                <li style="margin-bottom: 10px;">Enter your email and temporary password</li>
                <li style="margin-bottom: 10px;"><strong>Change your password immediately when prompted</strong></li>
                <li style="margin-bottom: 10px;">Complete your profile setup</li>
                <li style="margin-bottom: 10px;">Explore the dashboard and available features</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Portal
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">Security Notice</h4>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                This is a temporary password. For your security, you will be required to create a new password during your first login. 
                Please keep your credentials confidential and do not share them with anyone.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>If you have any questions, please contact our support team.</p>
              <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getPasswordResetTemplate(recipientName: string, resetToken: string): string {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">NHIS Portal</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Password Reset Request</p>
            </div>
            
            <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="margin-bottom: 20px;">We received a request to reset your password for your NHIS Portal account.</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
              <p style="margin: 0; color: #1f2937;">Click the button below to reset your password. This link will expire in 1 hour.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="margin-bottom: 20px; color: #6b7280; font-size: 14px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated message from the NHIS Portal. Please do not reply to this email.</p>
              <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getBatchClosureTemplate(recipientName: string, batchData: BatchClosureNotificationData): string {
    const approvalRate = batchData.totalClaims > 0 
      ? ((batchData.approvedClaims / batchData.totalClaims) * 100).toFixed(1) 
      : '0'

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batch Closure Report - ${batchData.batchNumber}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin: 0; font-size: 28px;">NHIS Portal</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Batch Closure Report</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Batch Processing Complete</h2>
      
      <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
      
      <p style="margin-bottom: 20px;">
        The batch <strong>${batchData.batchNumber}</strong> has been autonomously processed and closed by the TPA. 
        This notification is provided for oversight and record-keeping purposes.
      </p>
      
      <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Batch Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Batch Number:</td>
            <td style="padding: 8px 0; color: #1f2937;">${batchData.batchNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">TPA:</td>
            <td style="padding: 8px 0; color: #1f2937;">${batchData.tpaName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Healthcare Facility:</td>
            <td style="padding: 8px 0; color: #1f2937;">${batchData.facilityName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Total Claims:</td>
            <td style="padding: 8px 0; color: #1f2937;">${batchData.totalClaims.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Total Amount:</td>
            <td style="padding: 8px 0; color: #1f2937;">₦${batchData.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Payment Analysis</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Claims Approved:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${batchData.approvedClaims}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Claims Rejected:</td>
            <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">${batchData.rejectedClaims}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Approved Amount:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: bold;">₦${batchData.approvedAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Approval Rate:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${approvalRate}%</td>
          </tr>
        </table>
      </div>

      ${batchData.paymentJustification ? `
      <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Payment Justification</h3>
        <p style="margin: 0; color: #1f2937; line-height: 1.6;">${batchData.paymentJustification}</p>
      </div>
      ` : ''}

      ${batchData.reviewSummary ? `
      <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Review Summary</h3>
        <p style="margin: 0; color: #1f2937; line-height: 1.6;">${batchData.reviewSummary}</p>
      </div>
      ` : ''}

      ${batchData.forwardingLetterUrl ? `
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1f2937;">📎 Forwarding Letter Attached</h4>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          The official forwarding letter for this batch closure has been attached.
        </p>
        <a href="${batchData.forwardingLetterUrl}" 
           style="display: inline-block; margin-top: 10px; color: #3b82f6; text-decoration: none; font-weight: bold;">
          📄 View Forwarding Letter
        </a>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View in Portal
        </a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>This is an automated batch closure report from the NHIS Portal.</p>
        <p>© 2024 Nigerian Health Insurance Scheme. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case "approved":
        return "#10b981"
      case "rejected":
        return "#ef4444"
      case "pending_review":
        return "#f59e0b"
      case "submitted":
        return "#6366f1"
      default:
        return "#6b7280"
    }
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case "approved":
        return "Great news! Your claim has been approved and is being processed for payment."
      case "rejected":
        return "Unfortunately, your claim has been rejected. Please review the details below."
      case "pending_review":
        return "Your claim is currently under review by our team."
      case "submitted":
        return "Your claim has been successfully submitted and is awaiting review."
      default:
        return "There has been an update to your claim status."
    }
  }
}
