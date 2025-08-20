ALTER TABLE "users" ADD COLUMN "tpa_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "facility_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tpa_id_tpas_id_fk" FOREIGN KEY ("tpa_id") REFERENCES "public"."tpas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;