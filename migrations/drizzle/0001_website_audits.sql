CREATE TABLE "website_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"website_url" text,
	"website_found" boolean,
	"has_https" boolean,
	"has_mobile_layout" boolean,
	"has_booking" boolean,
	"has_menu_or_services" boolean,
	"has_clear_cta" boolean,
	"seo_score" integer,
	"performance_score" integer,
	"issues" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "website_audits" ADD CONSTRAINT "website_audits_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_website_audits_business" ON "website_audits" USING btree ("business_id");
