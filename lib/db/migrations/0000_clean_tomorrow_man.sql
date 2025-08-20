CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"tpa_id" integer NOT NULL,
	"total_claims" integer DEFAULT 0,
	"total_amount" numeric(15, 2) DEFAULT '0',
	"status" varchar(50) DEFAULT 'draft',
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial_number" integer,
	"unique_beneficiary_id" varchar(100) NOT NULL,
	"unique_claim_id" varchar(100) NOT NULL,
	"tpa_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"batch_number" varchar(100),
	"hospital_number" varchar(100),
	"date_of_admission" date,
	"beneficiary_name" varchar(255) NOT NULL,
	"date_of_birth" date,
	"age" integer,
	"address" text,
	"phone_number" varchar(20),
	"nin" varchar(20),
	"date_of_treatment" date,
	"date_of_discharge" date,
	"primary_diagnosis" text,
	"secondary_diagnosis" text,
	"treatment_procedure" text,
	"quantity" integer,
	"cost" numeric(12, 2),
	"date_of_claim_submission" date,
	"month_of_submission" varchar(20),
	"cost_of_investigation" numeric(12, 2),
	"cost_of_procedure" numeric(12, 2),
	"cost_of_medication" numeric(12, 2),
	"cost_of_other_services" numeric(12, 2),
	"total_cost_of_care" numeric(12, 2),
	"approved_cost_of_care" numeric(12, 2),
	"decision" varchar(50),
	"reason_for_rejection" text,
	"date_of_claims_payment" date,
	"tpa_remarks" text,
	"status" varchar(50) DEFAULT 'submitted',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "claims_unique_claim_id_unique" UNIQUE("unique_claim_id")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"state" varchar(100) NOT NULL,
	"address" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"tpa_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "facilities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tpas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tpas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_tpa_id_tpas_id_fk" FOREIGN KEY ("tpa_id") REFERENCES "public"."tpas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_tpa_id_tpas_id_fk" FOREIGN KEY ("tpa_id") REFERENCES "public"."tpas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_tpa_id_tpas_id_fk" FOREIGN KEY ("tpa_id") REFERENCES "public"."tpas"("id") ON DELETE no action ON UPDATE no action;