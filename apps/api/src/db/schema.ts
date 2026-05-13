import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";

export const complianceStatus = pgEnum("compliance_status", [
  "unknown",
  "pending_review",
  "approved",
  "restricted",
  "rejected",
  "expired"
]);

export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "needs_changes"
]);

export const agentRunStatus = pgEnum("agent_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "needs_review"
]);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name"),
    category: text("category"),
    vertical: text("vertical"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    phone: text("phone"),
    email: text("email"),
    websiteUrl: text("website_url"),
    websiteStatus: text("website_status"),
    complianceStatus: complianceStatus("compliance_status").notNull().default("unknown"),
    opportunityScore: integer("opportunity_score").notNull().default(0),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("idx_businesses_vertical").on(table.vertical),
    index("idx_businesses_city").on(table.city),
    index("idx_businesses_opportunity").on(table.opportunityScore)
  ]
);

export const sourceRecords = pgTable(
  "source_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    licenseName: text("license_name"),
    allowedUse: text("allowed_use").array().notNull().default([]),
    disallowedUse: text("disallowed_use").array().notNull().default([]),
    attributionRequired: boolean("attribution_required").notNull().default(false),
    attributionText: text("attribution_text"),
    containsPersonalData: boolean("contains_personal_data").notNull().default(false),
    marketingPermission: text("marketing_permission").notNull().default("unknown"),
    complianceStatus: complianceStatus("compliance_status").notNull().default("unknown"),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    rawPayloadHash: text("raw_payload_hash"),
    metadata: jsonb("metadata").notNull().default({}),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("idx_source_records_business").on(table.businessId),
    index("idx_source_records_status").on(table.complianceStatus)
  ]
);

export const websiteAudits = pgTable(
  "website_audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    websiteUrl: text("website_url"),
    websiteFound: boolean("website_found"),
    hasHttps: boolean("has_https"),
    hasMobileLayout: boolean("has_mobile_layout"),
    hasBooking: boolean("has_booking"),
    hasMenuOrServices: boolean("has_menu_or_services"),
    hasClearCta: boolean("has_clear_cta"),
    seoScore: integer("seo_score"),
    performanceScore: integer("performance_score"),
    issues: text("issues").array().notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("idx_website_audits_business").on(table.businessId)]
);

export const blueprints = pgTable("blueprints", {
  id: text("id").primaryKey(),
  vertical: text("vertical").notNull(),
  packageName: text("package_name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  title: text("title").notNull(),
  description: text("description"),
  requiredInputs: jsonb("required_inputs").notNull().default([]),
  features: jsonb("features").notNull().default([]),
  schemaJson: jsonb("schema_json").notNull().default({}),
  templateRef: text("template_ref"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  decision: approvalStatus("decision").notNull(),
  notes: text("notes"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    agentRunId: text("agent_run_id").notNull(),
    output: jsonb("output").notNull().default({}),
    approvalStatus: approvalStatus("approval_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("idx_business_profiles_business").on(table.businessId)]
);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    businessProfileId: uuid("business_profile_id")
      .notNull()
      .references(() => businessProfiles.id, { onDelete: "cascade" }),
    agentRunId: text("agent_run_id").notNull(),
    output: jsonb("output").notNull().default({}),
    approvalStatus: approvalStatus("approval_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("idx_proposals_business").on(table.businessId),
    index("idx_proposals_profile").on(table.businessProfileId)
  ]
);

export const generatedApps = pgTable(
  "generated_apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    agentRunId: text("agent_run_id").notNull(),
    appSpec: jsonb("app_spec").notNull().default({}),
    deploymentStatus: text("deployment_status").notNull().default("draft"),
    approvalStatus: approvalStatus("approval_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("idx_generated_apps_business").on(table.businessId),
    index("idx_generated_apps_proposal").on(table.proposalId)
  ]
);

export const previewBuilds = pgTable(
  "preview_builds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generatedAppId: uuid("generated_app_id")
      .notNull()
      .references(() => generatedApps.id, { onDelete: "cascade" }),
    buildType: text("build_type").notNull().default("preview"),
    status: text("status").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("idx_preview_builds_generated_app").on(table.generatedAppId)]
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    workflow: text("workflow"),
    agentName: text("agent_name").notNull(),
    promptVersion: text("prompt_version"),
    modelAlias: text("model_alias"),
    approvalStatus: text("approval_status").notNull().default("not_required"),
    inputHash: text("input_hash"),
    outputHash: text("output_hash"),
    inputJson: jsonb("input_json").notNull().default({}),
    outputJson: jsonb("output_json").notNull().default({}),
    status: agentRunStatus("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("idx_agent_runs_business").on(table.businessId),
    index("idx_agent_runs_agent").on(table.agentName),
    index("idx_agent_runs_status").on(table.status)
  ]
);

export const verticalDrafts = pgTable("vertical_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  verticalId: text("vertical_id").notNull(),
  createdBy: uuid("created_by"),
  status: text("status").notNull().default("draft"),
  wizardPayload: jsonb("wizard_payload").notNull().default({}),
  generatedBlueprint: jsonb("generated_blueprint"),
  generatedInputSchema: jsonb("generated_input_schema"),
  generatedAppConfig: jsonb("generated_app_config"),
  generatedCampaignPlaybook: jsonb("generated_campaign_playbook"),
  generatedQaChecklist: jsonb("generated_qa_checklist"),
  riskFlags: jsonb("risk_flags").notNull().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const verticals = pgTable(
  "verticals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verticalId: text("vertical_id").notNull(),
    name: text("name").notNull(),
    appPattern: text("app_pattern").notNull(),
    templateId: text("template_id").notNull(),
    status: text("status").notNull().default("draft"),
    version: text("version").notNull().default("1.0.0"),
    registryJson: jsonb("registry_json").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [unique("verticals_vertical_id_unique").on(table.verticalId)]
);

export const schema = {
  businesses,
  sourceRecords,
  websiteAudits,
  blueprints,
  approvals,
  businessProfiles,
  proposals,
  generatedApps,
  previewBuilds,
  agentRuns,
  verticalDrafts,
  verticals
};

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type SourceRecord = typeof sourceRecords.$inferSelect;
export type NewSourceRecord = typeof sourceRecords.$inferInsert;
export type WebsiteAudit = typeof websiteAudits.$inferSelect;
export type ApprovalRecord = typeof approvals.$inferSelect;
export type BusinessProfileRecord = typeof businessProfiles.$inferSelect;
export type ProposalRecord = typeof proposals.$inferSelect;
export type GeneratedAppRecord = typeof generatedApps.$inferSelect;
export type PreviewBuildRecord = typeof previewBuilds.$inferSelect;
export type AgentRunRecord = typeof agentRuns.$inferSelect;
export type VerticalDraftRecord = typeof verticalDrafts.$inferSelect;
export type NewAgentRunRecord = typeof agentRuns.$inferInsert;
