import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableColumns, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getSettings, repoRoot } from "../src/config.js";
import { getDatabaseConfig, schema } from "../src/db/index.js";
import {
  agentRunStatus,
  agentRuns,
  approvalStatus,
  approvals,
  blueprints,
  businessProfiles,
  businesses,
  complianceStatus,
  generatedApps,
  previewBuilds,
  proposals,
  sourceRecords,
  verticals,
  websiteAudits,
  verticalDrafts
} from "../src/db/schema.js";

describe("database foundation", () => {
  it("enables pgvector in the generated migration", () => {
    const migration = readFileSync(
      resolve(repoRoot, "migrations/drizzle/0000_remarkable_lockjaw.sql"),
      "utf8"
    );

    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS vector");
  });

  it("keeps migration application auditable without storing secrets", () => {
    const migrationRunner = readFileSync(
      resolve(repoRoot, "scripts/db/apply_migrations.sh"),
      "utf8"
    );

    expect(migrationRunner).toContain("read -r -s -p \"Supabase database password:");
    expect(migrationRunner).toContain("localgrowth_internal.schema_migrations");
    expect(migrationRunner).toContain("MIGRATIONS_BASELINE_EXISTING");
    expect(migrationRunner).toContain("shasum -a 256");
    expect(migrationRunner).toContain("-name '*.sql'");
    expect(migrationRunner).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("wraps Supabase app commands without requiring committed database URLs", () => {
    const wrapper = readFileSync(
      resolve(repoRoot, "scripts/db/with_supabase_database_url.sh"),
      "utf8"
    );

    expect(wrapper).toContain("if [[ -n \"${DATABASE_URL:-}\" ]]");
    expect(wrapper).toContain("read -r -s -p \"Supabase database password:");
    expect(wrapper).toContain("encodeURIComponent");
    expect(wrapper).toContain("export DATABASE_URL=");
    expect(wrapper).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("exposes core Sprint 1 tables", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "agentRuns",
      "approvals",
      "blueprints",
      "businessProfiles",
      "businesses",
      "generatedApps",
      "previewBuilds",
      "proposals",
      "sourceRecords",
      "verticalDrafts",
      "verticals",
      "websiteAudits"
    ]);

    expect(getTableName(businesses)).toBe("businesses");
    expect(getTableName(sourceRecords)).toBe("source_records");
    expect(getTableName(websiteAudits)).toBe("website_audits");
    expect(getTableName(businessProfiles)).toBe("business_profiles");
    expect(getTableName(proposals)).toBe("proposals");
    expect(getTableName(generatedApps)).toBe("generated_apps");
    expect(getTableName(previewBuilds)).toBe("preview_builds");
    expect(getTableName(agentRuns)).toBe("agent_runs");
    expect(getTableName(approvals)).toBe("approvals");
    expect(getTableName(verticalDrafts)).toBe("vertical_drafts");
    expect(getTableName(verticals)).toBe("verticals");
    expect(getTableName(blueprints)).toBe("blueprints");
  });

  it("enables RLS for all public app tables in Supabase", () => {
    const migration = readFileSync(
      resolve(repoRoot, "migrations/drizzle/0003_enable_public_table_rls.sql"),
      "utf8"
    );
    const tableNames = Object.values(schema).map((table) => getTableName(table));

    for (const tableName of tableNames) {
      expect(migration).toContain(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
    }

    expect(migration).not.toContain("CREATE POLICY");
    expect(migration).not.toContain("TO anon");
    expect(migration).not.toContain("TO authenticated");
  });

  it("stores polymorphic approval references as text", () => {
    const approvalColumns = getTableColumns(approvals);

    expect(approvalColumns.entityId.dataType).toBe("string");
    expect(approvalColumns.approvedBy.dataType).toBe("string");
  });

  it("requires source records to belong to a business", () => {
    const sourceRecordColumns = getTableColumns(sourceRecords);

    expect(sourceRecordColumns.businessId.notNull).toBe(true);
  });

  it("requires website audits to belong to a business", () => {
    const websiteAuditColumns = getTableColumns(websiteAudits);

    expect(websiteAuditColumns.businessId.notNull).toBe(true);
    expect(websiteAuditColumns.issues.notNull).toBe(true);
  });

  it("requires workflow records to keep parent references", () => {
    expect(getTableColumns(businessProfiles).businessId.notNull).toBe(true);
    expect(getTableColumns(proposals).businessProfileId.notNull).toBe(true);
    expect(getTableColumns(generatedApps).proposalId.notNull).toBe(true);
    expect(getTableColumns(previewBuilds).generatedAppId.notNull).toBe(true);
  });

  it("stores agent run approval status for auditability", () => {
    const agentRunColumns = getTableColumns(agentRuns);

    expect(agentRunColumns.approvalStatus.dataType).toBe("string");
    expect(agentRunColumns.approvalStatus.notNull).toBe(true);
    expect(agentRunColumns.approvalStatus.default).toBe("not_required");
    expect(agentRunColumns.updatedAt.notNull).toBe(true);
  });

  it("keeps locked enum values in code", () => {
    expect(complianceStatus.enumValues).toContain("pending_review");
    expect(approvalStatus.enumValues).toEqual(["pending", "approved", "rejected", "needs_changes"]);
    expect(agentRunStatus.enumValues).toEqual([
      "queued",
      "running",
      "completed",
      "failed",
      "needs_review"
    ]);
  });

  it("does not require a database connection for local tests", () => {
    expect(getDatabaseConfig(getSettings({}))).toEqual({
      configured: false,
      connectionKind: "unset",
      local: false
    });
    expect(
      getDatabaseConfig(getSettings({ DATABASE_URL: "postgresql://localhost/localgrowth_test" }))
    ).toEqual({
      configured: true,
      connectionKind: "local",
      local: true,
      redactedUrl: "postgresql://localhost/localgrowth_test",
      url: "postgresql://localhost/localgrowth_test"
    });
  });

  it("classifies and redacts non-local database config without connecting", () => {
    expect(
      getDatabaseConfig(
        getSettings({
          DATABASE_URL:
            "postgresql://postgres.project-ref:secret-value@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
        })
      )
    ).toEqual({
      configured: true,
      connectionKind: "supabase",
      local: false,
      redactedUrl:
        "postgresql://postgres.project-ref:redacted@aws-1-eu-central-2.pooler.supabase.com:5432/postgres",
      url: "postgresql://postgres.project-ref:secret-value@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
    });

    expect(getDatabaseConfig(getSettings({ DATABASE_URL: "not a url" }))).toEqual({
      configured: true,
      connectionKind: "invalid",
      local: false
    });
  });
});
