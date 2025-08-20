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
  dateOfClaimsPayment: date("date_of_claims_payment"),
  tpaRemarks: text("tpa_remarks"),

  // System fields
  status: varchar("status", { length: 50 }).default("submitted"), // 'submitted', 'awaiting_verification', 'not_verified', 'verified', 'verified_awaiting_payment', 'verified_paid'
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Batches for grouping claims
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 100 }).notNull().unique(),
  tpaId: integer("tpa_id")
    .references(() => tpas.id)
    .notNull(),
  totalClaims: integer("total_claims").default(0),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'submitted', 'reviewed', 'approved'
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
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

export const tpasRelations = relations(tpas, ({ many }) => ({
  users: many(users),
  facilities: many(facilities),
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
