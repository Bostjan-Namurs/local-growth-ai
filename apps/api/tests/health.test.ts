import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { getSettings } from "../src/config.js";
import { expectedMigrationVersions, publicAppTableNames, schema } from "../src/db/index.js";

describe("system routes", () => {
  it("returns health", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      app_env: "local",
      data_store: "memory",
      llm_mode: "fake"
    });
    expect(typeof response.json().database_configured).toBe("boolean");
    expect(typeof response.json().database_local).toBe("boolean");
    expect(["unset", "local", "supabase", "external", "invalid"]).toContain(
      response.json().database_connection_kind
    );
    expect(typeof response.json().supabase_configured).toBe("boolean");
    expect(typeof response.json().supabase_local).toBe("boolean");
    expect(["unset", "local", "supabase", "external", "invalid"]).toContain(
      response.json().supabase_connection_kind
    );
  });

  it("returns version", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/version" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      app_name: "localgrowth-ai",
      app_version: "0.1.0"
    });
  });

  it("returns skipped database health when DATABASE_URL is not configured", async () => {
    const app = createApp(getSettings({}));
    const response = await app.inject({ method: "GET", url: "/health/database" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "skipped",
      configured: false,
      connectionKind: "unset",
      local: false
    });
  });

  it("returns a clear database health error for invalid DATABASE_URL without connecting", async () => {
    const app = createApp(getSettings({ DATABASE_URL: "not a url" }));
    const response = await app.inject({ method: "GET", url: "/health/database" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "error",
      configured: true,
      connectionKind: "invalid",
      local: false,
      error: "DATABASE_URL is invalid"
    });
  });

  it("derives database readiness expectations from committed schema and migrations", () => {
    expect(expectedMigrationVersions()).toEqual([
      "0000_remarkable_lockjaw",
      "0001_website_audits",
      "0002_workflow_records",
      "0003_enable_public_table_rls"
    ]);
    expect(publicAppTableNames()).toEqual([
      "agent_runs",
      "approvals",
      "blueprints",
      "business_profiles",
      "businesses",
      "generated_apps",
      "preview_builds",
      "proposals",
      "source_records",
      "vertical_drafts",
      "verticals",
      "website_audits"
    ]);
    expect(publicAppTableNames()).toHaveLength(Object.keys(schema).length);
  });
});
