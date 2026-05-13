CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('queued', 'running', 'completed', 'failed', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'needs_changes');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('unknown', 'pending_review', 'approved', 'restricted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"workflow" text,
	"agent_name" text NOT NULL,
	"prompt_version" text,
	"model_alias" text,
	"approval_status" text DEFAULT 'not_required' NOT NULL,
	"input_hash" text,
	"output_hash" text,
	"input_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "agent_run_status" DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"decision" "approval_status" NOT NULL,
	"notes" text,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprints" (
	"id" text PRIMARY KEY NOT NULL,
	"vertical" text NOT NULL,
	"package_name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"required_inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"template_ref" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text,
	"category" text,
	"vertical" text,
	"address" text,
	"city" text,
	"country" text,
	"phone" text,
	"email" text,
	"website_url" text,
	"website_status" text,
	"compliance_status" "compliance_status" DEFAULT 'unknown' NOT NULL,
	"opportunity_score" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_name" text,
	"source_url" text,
	"license_name" text,
	"allowed_use" text[] DEFAULT '{}' NOT NULL,
	"disallowed_use" text[] DEFAULT '{}' NOT NULL,
	"attribution_required" boolean DEFAULT false NOT NULL,
	"attribution_text" text,
	"contains_personal_data" boolean DEFAULT false NOT NULL,
	"marketing_permission" text DEFAULT 'unknown' NOT NULL,
	"compliance_status" "compliance_status" DEFAULT 'unknown' NOT NULL,
	"retention_until" timestamp with time zone,
	"raw_payload_hash" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vertical_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vertical_id" text NOT NULL,
	"created_by" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"wizard_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_blueprint" jsonb,
	"generated_input_schema" jsonb,
	"generated_app_config" jsonb,
	"generated_campaign_playbook" jsonb,
	"generated_qa_checklist" jsonb,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verticals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vertical_id" text NOT NULL,
	"name" text NOT NULL,
	"app_pattern" text NOT NULL,
	"template_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"registry_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verticals_vertical_id_unique" UNIQUE("vertical_id")
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_runs_business" ON "agent_runs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_agent" ON "agent_runs" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_status" ON "agent_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_businesses_vertical" ON "businesses" USING btree ("vertical");--> statement-breakpoint
CREATE INDEX "idx_businesses_city" ON "businesses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_businesses_opportunity" ON "businesses" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX "idx_source_records_business" ON "source_records" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_source_records_status" ON "source_records" USING btree ("compliance_status");
