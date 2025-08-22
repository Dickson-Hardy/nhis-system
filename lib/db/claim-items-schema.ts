import { pgTable, serial, integer, varchar, text, decimal, timestamp, boolean, date } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { claims, users } from "./schema"

// Individual items for each claim - procedures, medications, investigations etc.
export const claimItems = pgTable("claim_items", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  
  // Item Classification
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'investigation', 'procedure', 'medication', 'other_service'
  itemCategory: varchar("item_category", { length: 100 }), // 'laboratory', 'radiology', 'surgery', 'consultation', etc.
  
  // Item Details
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemDescription: text("item_description"),
  itemCode: varchar("item_code", { length: 50 }), // Medical coding if available
  
  // Quantity and Dosage (for medications)
  quantity: integer("quantity").default(1),
  unit: varchar("unit", { length: 50 }), // 'tablets', 'ml', 'sessions', 'days', etc.
  dosage: varchar("dosage", { length: 100 }), // For medications: '500mg', '2 tablets daily', etc.
  duration: varchar("duration", { length: 50 }), // '7 days', '2 weeks', etc.
  
  // Cost Information
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  
  // Dates
  serviceDate: date("service_date"), // When the service was provided
  prescribedDate: date("prescribed_date"), // For medications
  
  // Medical Information
  prescribedBy: varchar("prescribed_by", { length: 255 }), // Doctor's name
  indication: text("indication"), // Why was this prescribed/performed
  urgency: varchar("urgency", { length: 20 }), // 'routine', 'urgent', 'emergency'
  
  // TPA Review Fields
  isReviewed: boolean("is_reviewed").default(false),
  reviewStatus: varchar("review_status", { length: 50 }).default("pending"), // 'pending', 'approved', 'rejected', 'needs_clarification'
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  // Approved amounts (after TPA review)
  approvedQuantity: integer("approved_quantity"),
  approvedUnitCost: decimal("approved_unit_cost", { precision: 12, scale: 2 }),
  approvedTotalCost: decimal("approved_total_cost", { precision: 12, scale: 2 }),
  rejectionReason: text("rejection_reason"),
  
  // NHIA Standards Compliance
  nhiaStandardCost: decimal("nhia_standard_cost", { precision: 12, scale: 2 }), // Reference cost from NHIA
  costVariancePercentage: decimal("cost_variance_percentage", { precision: 5, scale: 2 }), // Calculated variance
  complianceFlag: varchar("compliance_flag", { length: 20 }), // 'compliant', 'needs_review', 'excessive'
  
  // Supporting Documentation
  supportingDocuments: text("supporting_documents"), // JSON array of document URLs
  prescriptionUrl: varchar("prescription_url", { length: 500 }),
  labResultUrl: varchar("lab_result_url", { length: 500 }),
  
  // Audit Fields
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// TPA Summary of claim items (after review and cleanup)
export const claimItemSummaries = pgTable("claim_item_summaries", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  
  // Summary by Category
  totalInvestigationCost: decimal("total_investigation_cost", { precision: 12, scale: 2 }).default("0"),
  totalProcedureCost: decimal("total_procedure_cost", { precision: 12, scale: 2 }).default("0"),
  totalMedicationCost: decimal("total_medication_cost", { precision: 12, scale: 2 }).default("0"),
  totalOtherServicesCost: decimal("total_other_services_cost", { precision: 12, scale: 2 }).default("0"),
  
  // Approved Totals (after TPA review)
  approvedInvestigationCost: decimal("approved_investigation_cost", { precision: 12, scale: 2 }).default("0"),
  approvedProcedureCost: decimal("approved_procedure_cost", { precision: 12, scale: 2 }).default("0"),
  approvedMedicationCost: decimal("approved_medication_cost", { precision: 12, scale: 2 }).default("0"),
  approvedOtherServicesCost: decimal("approved_other_services_cost", { precision: 12, scale: 2 }).default("0"),
  
  // Grand Totals
  totalClaimedAmount: decimal("total_claimed_amount", { precision: 12, scale: 2 }).notNull(),
  totalApprovedAmount: decimal("total_approved_amount", { precision: 12, scale: 2 }).notNull(),
  totalRejectedAmount: decimal("total_rejected_amount", { precision: 12, scale: 2 }).default("0"),
  
  // Item Counts
  totalItemsCount: integer("total_items_count").notNull(),
  approvedItemsCount: integer("approved_items_count").default(0),
  rejectedItemsCount: integer("rejected_items_count").default(0),
  pendingItemsCount: integer("pending_items_count").default(0),
  
  // TPA Review Summary
  overallReviewStatus: varchar("overall_review_status", { length: 50 }).default("pending"), // 'pending', 'completed', 'needs_clarification'
  tpaRemarks: text("tpa_remarks"),
  clinicalJustification: text("clinical_justification"),
  costJustification: text("cost_justification"),
  
  // Compliance Metrics
  nhiaComplianceScore: decimal("nhia_compliance_score", { precision: 5, scale: 2 }), // 0-100%
  averageCostVariance: decimal("average_cost_variance", { precision: 5, scale: 2 }), // Average variance from NHIA standards
  highCostItemsCount: integer("high_cost_items_count").default(0), // Items exceeding NHIA by >25%
  
  // Workflow
  summaryGeneratedAt: timestamp("summary_generated_at"),
  summaryGeneratedBy: integer("summary_generated_by").references(() => users.id),
  isFinalized: boolean("is_finalized").default(false),
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: integer("finalized_by").references(() => users.id),
  
  // Audit Fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Relations
export const claimItemsRelations = relations(claimItems, ({ one }) => ({
  claim: one(claims, {
    fields: [claimItems.claimId],
    references: [claims.id],
  }),
  createdByUser: one(users, {
    fields: [claimItems.createdBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [claimItems.reviewedBy],
    references: [users.id],
  }),
}))

export const claimItemSummariesRelations = relations(claimItemSummaries, ({ one }) => ({
  claim: one(claims, {
    fields: [claimItemSummaries.claimId],
    references: [claims.id],
  }),
  summaryGeneratedByUser: one(users, {
    fields: [claimItemSummaries.summaryGeneratedBy],
    references: [users.id],
  }),
  finalizedByUser: one(users, {
    fields: [claimItemSummaries.finalizedBy],
    references: [users.id],
  }),
}))