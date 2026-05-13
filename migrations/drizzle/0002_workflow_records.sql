CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"agent_run_id" text NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"business_profile_id" uuid NOT NULL,
	"agent_run_id" text NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"agent_run_id" text NOT NULL,
	"app_spec" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deployment_status" text DEFAULT 'draft' NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preview_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generated_app_id" uuid NOT NULL,
	"build_type" text DEFAULT 'preview' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD CONSTRAINT "generated_apps_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD CONSTRAINT "generated_apps_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_builds" ADD CONSTRAINT "preview_builds_generated_app_id_generated_apps_id_fk" FOREIGN KEY ("generated_app_id") REFERENCES "public"."generated_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_business_profiles_business" ON "business_profiles" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_business" ON "proposals" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_profile" ON "proposals" USING btree ("business_profile_id");--> statement-breakpoint
CREATE INDEX "idx_generated_apps_business" ON "generated_apps" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_generated_apps_proposal" ON "generated_apps" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_preview_builds_generated_app" ON "preview_builds" USING btree ("generated_app_id");
