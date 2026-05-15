import { describe, expect, it } from "vitest";
import {
  databaseConfigured,
  databaseConnectionKind,
  databaseIsLocal,
  getSettings,
  llmModelAliases,
  redactConnectionUrl,
  supabaseConfigured,
  supabaseConnectionKind,
  supabaseIsLocal
} from "../src/config.js";

describe("config", () => {
  it("loads safe defaults", () => {
    const settings = getSettings({});

    expect(settings.appEnv).toBe("local");
    expect(settings.dataStore).toBe("memory");
    expect(settings.llmMode).toBe("fake");
    expect(settings.workerQueueMode).toBe("local");
    expect(settings.workerQueueName).toBe("localgrowth.worker");
    expect(settings.internalApiToken).toBeUndefined();
    expect(settings.enableRealOutreach).toBe(false);
    expect(settings.enableProductionDeploy).toBe(false);
    expect(settings.enableCodexHandoff).toBe(false);
    expect(databaseConfigured(settings)).toBe(false);
  });

  it("can opt into the postgres data store explicitly", () => {
    expect(getSettings({ DATA_STORE: "postgres" }).dataStore).toBe("postgres");
  });

  it("loads documented gateway mode from environment", () => {
    const settings = getSettings({
      APP_ENV: "test",
      LLM_MODE: "gateway",
      DATABASE_URL: "postgresql://localhost/test",
      WORKER_QUEUE_MODE: "redis",
      WORKER_QUEUE_NAME: "localgrowth.test",
      INTERNAL_API_TOKEN: "test-token"
    });

    expect(settings.appEnv).toBe("test");
    expect(settings.llmMode).toBe("gateway");
    expect(settings.workerQueueMode).toBe("redis");
    expect(settings.workerQueueName).toBe("localgrowth.test");
    expect(settings.internalApiToken).toBe("test-token");
    expect(databaseConfigured(settings)).toBe(true);
    expect(databaseIsLocal(settings)).toBe(true);
    expect(databaseConnectionKind(settings)).toBe("local");
  });

  it("classifies external Supabase database URLs without connecting", () => {
    const settings = getSettings({
      DATABASE_URL: "postgresql://postgres:example@db.project-ref.supabase.co:5432/postgres"
    });
    const poolerSettings = getSettings({
      DATABASE_URL:
        "postgresql://postgres.project-ref:example@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
    });

    expect(databaseConfigured(settings)).toBe(true);
    expect(databaseIsLocal(settings)).toBe(false);
    expect(databaseConnectionKind(settings)).toBe("supabase");
    expect(databaseConfigured(poolerSettings)).toBe(true);
    expect(databaseIsLocal(poolerSettings)).toBe(false);
    expect(databaseConnectionKind(poolerSettings)).toBe("supabase");
  });

  it("classifies Supabase configuration without connecting", () => {
    const localSettings = getSettings({
      SUPABASE_URL: "http://localhost:54321"
    });
    const productionSettings = getSettings({
      SUPABASE_URL: "https://project-ref.supabase.co"
    });

    expect(supabaseConfigured(getSettings({}))).toBe(false);
    expect(supabaseConfigured(localSettings)).toBe(true);
    expect(supabaseIsLocal(localSettings)).toBe(true);
    expect(supabaseConnectionKind(localSettings)).toBe("local");
    expect(supabaseIsLocal(productionSettings)).toBe(false);
    expect(supabaseConnectionKind(productionSettings)).toBe("supabase");
  });

  it("parses string safety flags without treating false as truthy", () => {
    const settings = getSettings({
      ENABLE_REAL_OUTREACH: "false",
      ENABLE_PRODUCTION_DEPLOY: "0",
      ENABLE_CODEX_HANDOFF: "off"
    });

    expect(settings.enableRealOutreach).toBe(false);
    expect(settings.enableProductionDeploy).toBe(false);
    expect(settings.enableCodexHandoff).toBe(false);
  });

  it("accepts explicit true strings for local feature-flag tests", () => {
    const settings = getSettings({
      ENABLE_REAL_OUTREACH: "true",
      ENABLE_PRODUCTION_DEPLOY: "1",
      ENABLE_CODEX_HANDOFF: "on"
    });

    expect(settings.enableRealOutreach).toBe(true);
    expect(settings.enableProductionDeploy).toBe(true);
    expect(settings.enableCodexHandoff).toBe(true);
  });

  it("exposes locked model aliases", () => {
    expect(llmModelAliases(getSettings({}))).toEqual({
      classifier: "classifier",
      extractor: "extractor",
      profiler: "profiler",
      writer: "writer",
      proposal_writer: "proposal_writer",
      content_writer: "content_writer",
      coder: "coder",
      judge: "judge",
      embedding: "embedding"
    });
  });

  it("redacts connection URL passwords for safe diagnostics", () => {
    expect(
      redactConnectionUrl("postgresql://postgres:secret-value@db.project-ref.supabase.co:5432/postgres")
    ).toBe("postgresql://postgres:redacted@db.project-ref.supabase.co:5432/postgres");
    expect(redactConnectionUrl("not a url")).toBeUndefined();
    expect(redactConnectionUrl(undefined)).toBeUndefined();
  });
});
