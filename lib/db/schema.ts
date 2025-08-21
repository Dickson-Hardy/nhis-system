import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, serial } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table for authentication across all portals
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'tpa', 'facility', 'nhis_admin'
  name: varchar("name", { length: 255 }).notNull(),
  tpaId: integer("tpa_id").references(() => tpas.id),
  facilityId: integer("facility_id").references(() => facilities.id),
  isActive: boolean("is_active").default(true),
  isTemporaryPassword: boolean("is_temporary_password").default(false),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastPasswordChange: timestamp("last_password_change"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// TPAs (Third Party Administrators)
export const tpas = pgTable("tpas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Healthcare Facilities
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  state: varchar("state", { length: 100 }).notNull(),
  address: text("address"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  tpaId: integer("tpa_id").references(() => tpas.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Claims/Records - Main table with all the Excel fields
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  serialNumber: integer("serial_number"),
  uniqueBeneficiaryId: varchar("unique_beneficiary_id", { length: 100 }).notNull(),
  uniqueClaimId: varchar("unique_claim_id", { length: 100 }).notNull().unique(),
  tpaId: integer("tpa_id")
    .references(() => tpas.id)
    .notNull(),
  facilityId: integer("facility_id")
    .references(() => facilities.id)
    .notNull(),
  batchNumber: varchar("batch_number", { length: 100 }),
  batchId: integer("batch_id").references(() => batches.id),
  hospitalNumber: varchar("hospital_number", { length: 100 }),

  // Patient Information
  dateOfAdmission: date("date_of_admission"),
  beneficiaryName: varchar("beneficiary_name", { length: 255 }).notNull(),
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  address: text("address"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  nin: varchar("nin", { length: 20 }),

  // Treatment Information
  dateOfTreatment: date("date_of_treatment"),
  dateOfDischarge: date("date_of_discharge"),
  primaryDiagnosis: text("primary_diagnosis"),
  secondaryDiagnosis: text("secondary_diagnosis"),
  treatmentProcedure: text("treatment_procedure"),
  quantity: integer("quantity"),
  cost: decimal("cost", { precision: 12, scale: 2 }),

  // Submission Information
  dateOfClaimSubmission: date("date_of_claim_submission"),
  monthOfSubmission: varchar("month_of_submission", { length: 20 }),

  // Cost Breakdown
  costOfInvestigation: decimal("cost_of_investigation", { precision: 12, scale: 2 }),
  costOfProcedure: decimal("cost_of_procedure", { precision: 12, scale: 2 }),
  costOfMedication: decimal("cost_of_medication", { precision: 12, scale: 2 }),
  costOfOtherServices: decimal("cost_of_other_services", { precision: 12, scale: 2 }),
  totalCostOfCare: decimal("total_cost_of_care", { precision: 12, scale: 2 }),
  approvedCostOfCare: decimal("approved_cost_of_care", { precision: 12, scale: 2 }),

  // Decision and Payment
  decision: varchar("decision", { length: 50 }), // 'approved', 'rejected', 'pending'
  reasonForRejection: text("reason_for_rejection"),
  rejectionReason: text("rejection_reason"), // Additional rejection reason field
  dateOfClaimsPayment: date("date_of_claims_payment"),
  tpaRemarks: text("tpa_remarks"),

  // System fields
  status: varchar("status", { length: 50 }).default("submitted"), // 'submitted', 'awaiting_verification', 'not_verified', 'verified', 'verified_awaiting_payment', 'verified_paid'
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'success', 'error', 'warning', 'info'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Batches for grouping claims
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 100 }).notNull().unique(),
  tpaId: integer("tpa_id")
    .references(() => tpas.id)
    .notNull(),
  facilityId: integer("facility_id")
    .references(() => facilities.id)
    .notNull(),
  
  // Batch Management
  batchType: varchar("batch_type", { length: 50 }).default("weekly"), // 'weekly', 'monthly', 'special'
  weekStartDate: date("week_start_date"),
  weekEndDate: date("week_end_date"),
  
  // Batch Status
  status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'ready_for_submission', 'submitted', 'under_review', 'approved', 'rejected', 'verified_paid'
  
  // Claim Summary
  totalClaims: integer("total_claims").default(0),
  completedClaims: integer("completed_claims").default(0),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  approvedAmount: decimal("approved_amount", { precision: 15, scale: 2 }).default("0"),
  
  // Admin Fee Calculation
  adminFeePercentage: decimal("admin_fee_percentage", { precision: 5, scale: 2 }).default("5.00"),
  adminFeeAmount: decimal("admin_fee_amount", { precision: 15, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).default("0"),
  
  // Document Management
  forwardingLetterContent: text("forwarding_letter_content"),
  coverLetterUrl: varchar("cover_letter_url", { length: 500 }),
  coverLetterPublicId: varchar("cover_letter_public_id", { length: 255 }),
  coverLetterFileName: varchar("cover_letter_file_name", { length: 255 }),
  
  // Submission Details
  submissionEmails: text("submission_emails"), // JSON array of email addresses
  submissionNotes: text("submission_notes"),
  forwardingLetterGenerated: boolean("forwarding_letter_generated").default(false),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  approvedAt: timestamp("approved_at"),
  closedAt: timestamp("closed_at"),
  
  // User Tracking
  createdBy: integer("created_by").references(() => users.id),
  submittedBy: integer("submitted_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Error Logs for tracking discrepancies and validation errors
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => batches.id),
  claimId: integer("claim_id").references(() => claims.id),
  tpaId: integer("tpa_id").references(() => tpas.id),
  facilityId: integer("facility_id").references(() => facilities.id),
  
  // Error Classification
  errorType: varchar("error_type", { length: 100 }).notNull(), // 'validation', 'discrepancy', 'fraud', 'quality'
  errorCategory: varchar("error_category", { length: 100 }).notNull(), // 'missing_data', 'duplicate', 'cost_anomaly', 'decision_mismatch'
  severity: varchar("severity", { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  
  // Error Details
  errorCode: varchar("error_code", { length: 50 }).notNull(),
  errorTitle: varchar("error_title", { length: 255 }).notNull(),
  errorDescription: text("error_description").notNull(),
  
  // Data Validation
  fieldName: varchar("field_name", { length: 100 }),
  expectedValue: text("expected_value"),
  actualValue: text("actual_value"),
  
  // Financial Validation
  expectedAmount: decimal("expected_amount", { precision: 15, scale: 2 }),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }),
  amountDeviation: decimal("amount_deviation", { precision: 15, scale: 2 }),
  deviationPercentage: decimal("deviation_percentage", { precision: 5, scale: 2 }),
  
  // Status and Resolution
  status: varchar("status", { length: 50 }).default("open"), // 'open', 'under_review', 'resolved', 'ignored'
  resolution: text("resolution"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Error Rules and Thresholds for automated validation
export const errorRules = pgTable("error_rules", {
  id: serial("id").primaryKey(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleDescription: text("rule_description").notNull(),
  
  // Rule Configuration
  errorType: varchar("error_type", { length: 100 }).notNull(),
  errorCategory: varchar("error_category", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  
  // Validation Criteria
  fieldName: varchar("field_name", { length: 100 }),
  validationType: varchar("validation_type", { length: 50 }), // 'required', 'range', 'format', 'custom'
  validationRule: text("validation_rule"), // JSON or SQL condition
  thresholdValue: decimal("threshold_value", { precision: 15, scale: 2 }),
  
  // Financial Thresholds
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }),
  maxDeviationPercentage: decimal("max_deviation_percentage", { precision: 5, scale: 2 }),
  
  // Rule Status
  isActive: boolean("is_active").default(true),
  isAutomated: boolean("is_automated").default(true),
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Error Review Sessions for TPA and Admin collaboration
export const errorReviews = pgTable("error_reviews", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => batches.id),
  tpaId: integer("tpa_id").references(() => tpas.id),
  
  // Review Details
  reviewType: varchar("review_type", { length: 50 }).notNull(), // 'tpa_review', 'admin_review', 'joint_review'
  reviewStatus: varchar("review_status", { length: 50 }).default("pending"), // 'pending', 'in_progress', 'completed', 'escalated'
  
  // Review Content
  reviewNotes: text("review_notes"),
  actionItems: text("action_items"),
  recommendations: text("recommendations"),
  
  // Participants
  tpaReviewer: integer("tpa_reviewer").references(() => users.id),
  adminReviewer: integer("admin_reviewer").references(() => users.id),
  
  // Timestamps
  tpaReviewedAt: timestamp("tpa_reviewed_at"),
  adminReviewedAt: timestamp("admin_reviewed_at"),
  completedAt: timestamp("completed_at"),
  
  // Audit Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  tpa: one(tpas, {
    fields: [users.tpaId],
    references: [tpas.id],
  }),
  facility: one(facilities, {
    fields: [users.facilityId],
    references: [facilities.id],
  }),
  claims: many(claims),
  batches: many(batches),
}))

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  tpa: one(tpas, {
    fields: [facilities.tpaId],
    references: [tpas.id],
  }),
  users: many(users),
  claims: many(claims),
}))

export const claimsRelations = relations(claims, ({ one }) => ({
  tpa: one(tpas, {
    fields: [claims.tpaId],
    references: [tpas.id],
  }),
  facility: one(facilities, {
    fields: [claims.facilityId],
    references: [facilities.id],
  }),
  createdBy: one(users, {
    fields: [claims.createdBy],
    references: [users.id],
  }),
}))

export const batchesRelations = relations(batches, ({ one }) => ({
  tpa: one(tpas, {
    fields: [batches.tpaId],
    references: [tpas.id],
  }),
  createdBy: one(users, {
    fields: [batches.createdBy],
    references: [users.id],
  }),
}))

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  batch: one(batches, {
    fields: [errorLogs.batchId],
    references: [batches.id],
  }),
  claim: one(claims, {
    fields: [errorLogs.claimId],
    references: [claims.id],
  }),
  tpa: one(tpas, {
    fields: [errorLogs.tpaId],
    references: [tpas.id],
  }),
  facility: one(facilities, {
    fields: [errorLogs.facilityId],
    references: [facilities.id],
  }),
  createdByUser: one(users, {
    fields: [errorLogs.createdBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [errorLogs.resolvedBy],
    references: [users.id],
  }),
}))

export const errorRulesRelations = relations(errorRules, ({ one }) => ({
  createdByUser: one(users, {
    fields: [errorRules.createdBy],
    references: [users.id],
  }),
}))

export const errorReviewsRelations = relations(errorReviews, ({ one }) => ({
  batch: one(batches, {
    fields: [errorReviews.batchId],
    references: [batches.id],
  }),
  tpa: one(tpas, {
    fields: [errorReviews.tpaId],
    references: [tpas.id],
  }),
  tpaReviewer: one(users, {
    fields: [errorReviews.tpaReviewer],
    references: [users.id],
  }),
  adminReviewer: one(users, {
    fields: [errorReviews.adminReviewer],
    references: [users.id],
  }),
}))

// Financial Management Tables

// Advance Payments to TPAs
export const advancePayments = pgTable("advance_payments", {
  id: serial("id").primaryKey(),
  tpaId: integer("tpa_id").references(() => tpas.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 100 }).notNull().unique(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // 'bank_transfer', 'cheque', 'online'
  bankDetails: text("bank_details"), // JSON string with bank information
  description: text("description"),
  purpose: varchar("purpose", { length: 100 }).notNull(), // 'working_capital', 'emergency_fund', 'quarterly_advance'
  
  // Receipt and Documentation
  receiptUrl: varchar("receipt_url", { length: 500 }), // Cloudinary URL
  receiptPublicId: varchar("receipt_public_id", { length: 255 }), // Cloudinary public ID
  receiptFileName: varchar("receipt_file_name", { length: 255 }),
  
  // Status and Approval
  status: varchar("status", { length: 50 }).default("pending"), // 'pending', 'approved', 'disbursed', 'cancelled'
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  disbursedBy: integer("disbursed_by").references(() => users.id),
  disbursedAt: timestamp("disbursed_at"),
  
  // Reconciliation
  isReconciled: boolean("is_reconciled").default(false),
  reconciledAt: timestamp("reconciled_at"),
  reconciledBy: integer("reconciled_by").references(() => users.id),
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Reimbursements from NHIS to TPAs (Batch-based)
export const reimbursements = pgTable("reimbursements", {
  id: serial("id").primaryKey(),
  tpaId: integer("tpa_id").references(() => tpas.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  reimbursementReference: varchar("reimbursement_reference", { length: 100 }).notNull().unique(),
  reimbursementDate: date("reimbursement_date").notNull(),
  reimbursementMethod: varchar("reimbursement_method", { length: 50 }).notNull(),
  
  // Batch-based reimbursement
  batchIds: text("batch_ids").notNull(), // JSON array of batch IDs being reimbursed
  reimbursementType: varchar("reimbursement_type", { length: 50 }).default("batch"), // 'batch', 'bulk_batch'
  periodStart: date("period_start"), // Reimbursement period start
  periodEnd: date("period_end"), // Reimbursement period end
  
  // Financial Breakdown
  totalClaimsAmount: decimal("total_claims_amount", { precision: 15, scale: 2 }), // Total claims covered
  adminFeePercentage: decimal("admin_fee_percentage", { precision: 5, scale: 2 }), // Admin fee %
  adminFeeAmount: decimal("admin_fee_amount", { precision: 15, scale: 2 }), // Admin fee amount
  netReimbursementAmount: decimal("net_reimbursement_amount", { precision: 15, scale: 2 }), // After admin fees
  
  // Receipt and Documentation
  receiptUrl: varchar("receipt_url", { length: 500 }), // Cloudinary URL
  receiptPublicId: varchar("receipt_public_id", { length: 255 }), // Cloudinary public ID
  receiptFileName: varchar("receipt_file_name", { length: 255 }),
  
  // Additional Documents
  supportingDocsUrls: text("supporting_docs_urls"), // JSON array of Cloudinary URLs
  supportingDocsPublicIds: text("supporting_docs_public_ids"), // JSON array of public IDs
  
  // Status and Processing
  status: varchar("status", { length: 50 }).default("pending"), // 'pending', 'processed', 'completed', 'disputed'
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  
  // Notes and Comments
  description: text("description"),
  processingNotes: text("processing_notes"),
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Financial Transactions Log (for audit trail)
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'advance_payment', 'reimbursement', 'adjustment'
  referenceType: varchar("reference_type", { length: 50 }).notNull(), // 'advance_payment', 'reimbursement'
  referenceId: integer("reference_id").notNull(), // ID of the advance_payment or reimbursement
  tpaId: integer("tpa_id").references(() => tpas.id).notNull(),
  
  // Transaction Details
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  description: text("description"),
  
  // Status
  status: varchar("status", { length: 50 }).default("active"), // 'active', 'reversed', 'adjusted'
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Financial Relations
export const advancePaymentsRelations = relations(advancePayments, ({ one }) => ({
  tpa: one(tpas, {
    fields: [advancePayments.tpaId],
    references: [tpas.id],
  }),
  createdByUser: one(users, {
    fields: [advancePayments.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [advancePayments.approvedBy],
    references: [users.id],
  }),
  disbursedByUser: one(users, {
    fields: [advancePayments.disbursedBy],
    references: [users.id],
  }),
  reconciledByUser: one(users, {
    fields: [advancePayments.reconciledBy],
    references: [users.id],
  }),
}))

export const reimbursementsRelations = relations(reimbursements, ({ one }) => ({
  tpa: one(tpas, {
    fields: [reimbursements.tpaId],
    references: [tpas.id],
  }),
  createdByUser: one(users, {
    fields: [reimbursements.createdBy],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [reimbursements.processedBy],
    references: [users.id],
  }),
}))

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  tpa: one(tpas, {
    fields: [financialTransactions.tpaId],
    references: [tpas.id],
  }),
  createdByUser: one(users, {
    fields: [financialTransactions.createdBy],
    references: [users.id],
  }),
}))

// Update TPAs relations to include financial data
export const tpasRelations = relations(tpas, ({ many }) => ({
  users: many(users),
  facilities: many(facilities),
  claims: many(claims),
  batches: many(batches),
  advancePayments: many(advancePayments),
  reimbursements: many(reimbursements),
  financialTransactions: many(financialTransactions),
}))

// Batch Closure Reports
export const batchClosureReports = pgTable("batch_closure_reports", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => batches.id).notNull(),
  
  // Report Content
  reviewSummary: text("review_summary").notNull(),
  paymentJustification: text("payment_justification").notNull(),
  rejectionReasons: text("rejection_reasons"), // JSON string
  
  // Payment Details
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).notNull(),
  paidClaims: integer("paid_claims").notNull(),
  beneficiariesPaid: integer("beneficiaries_paid").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }).notNull(),
  
  // Document Attachments
  forwardingLetterUrl: varchar("forwarding_letter_url", { length: 500 }),
  forwardingLetterPublicId: varchar("forwarding_letter_public_id", { length: 255 }),
  forwardingLetterFileName: varchar("forwarding_letter_file_name", { length: 255 }),
  additionalDocuments: text("additional_documents"), // JSON string
  
  // Digital Signatures
  tpaSignature: varchar("tpa_signature", { length: 255 }).notNull(),
  tpaSignedBy: varchar("tpa_signed_by", { length: 255 }).notNull(),
  tpaSignedAt: timestamp("tpa_signed_at").notNull(),
  adminSignature: varchar("admin_signature", { length: 255 }),
  adminSignedBy: varchar("admin_signed_by", { length: 255 }),
  adminSignedAt: timestamp("admin_signed_at"),
  
  // Status and Timestamps
  status: varchar("status", { length: 50 }).default("submitted"),
  submittedBy: integer("submitted_by").references(() => users.id).notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Batch Payment Summaries
export const batchPaymentSummaries = pgTable("batch_payment_summaries", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => batches.id).notNull(),
  batchClosureReportId: integer("batch_closure_report_id").references(() => batchClosureReports.id),
  
  // Payment Summary
  totalPaidAmount: decimal("total_paid_amount", { precision: 15, scale: 2 }).notNull(),
  numberOfBeneficiaries: integer("number_of_beneficiaries").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }).notNull(),
  
  // TPA Information
  tpaId: integer("tpa_id").references(() => tpas.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // Administrative
  remarks: text("remarks"),
  status: varchar("status", { length: 50 }).default("active"),
  
  // Audit Fields
  submittedBy: integer("submitted_by").references(() => users.id).notNull(),
  submittedAt: timestamp("submitted_at").notNull(),
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Batch Closure Reports Relations
export const batchClosureReportsRelations = relations(batchClosureReports, ({ one }) => ({
  batch: one(batches, {
    fields: [batchClosureReports.batchId],
    references: [batches.id],
  }),
  submittedByUser: one(users, {
    fields: [batchClosureReports.submittedBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [batchClosureReports.reviewedBy],
    references: [users.id],
  }),
}))

// Batch Payment Summaries Relations
export const batchPaymentSummariesRelations = relations(batchPaymentSummaries, ({ one }) => ({
  batch: one(batches, {
    fields: [batchPaymentSummaries.batchId],
    references: [batches.id],
  }),
  batchClosureReport: one(batchClosureReports, {
    fields: [batchPaymentSummaries.batchClosureReportId],
    references: [batchClosureReports.id],
  }),
  tpa: one(tpas, {
    fields: [batchPaymentSummaries.tpaId],
    references: [tpas.id],
  }),
  facility: one(facilities, {
    fields: [batchPaymentSummaries.facilityId],
    references: [facilities.id],
  }),
  submittedByUser: one(users, {
    fields: [batchPaymentSummaries.submittedBy],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [batchPaymentSummaries.processedBy],
    references: [users.id],
  }),
}))
