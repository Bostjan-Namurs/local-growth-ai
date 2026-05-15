import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(currentDir, "../../..");

loadEnv({ path: resolve(repoRoot, ".env") });

const envBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  return value;
}, z.boolean());

const settingsSchema = z.object({
  appEnv: z.string().default("local"),
  appName: z.string().default("localgrowth-ai"),
  appVersion: z.string().default("0.1.0"),
  logLevel: z.string().default("info"),
  apiHost: z.string().default("0.0.0.0"),
  apiPort: z.coerce.number().int().positive().default(8000),
  corsOrigins: z.string().default("http://localhost:3000"),
  databaseUrl: z.string().optional(),
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  supabaseServiceRoleKey: z.string().optional(),
  redisUrl: z.string().optional(),
  workerQueueMode: z.enum(["local", "redis"]).default("local"),
  workerQueueName: z.string().default("localgrowth.worker"),
  dataStore: z.enum(["memory", "postgres"]).default("memory"),
  llmMode: z.enum(["fake", "gateway"]).default("fake"),
  llmGatewayBaseUrl: z.string().default("http://localhost:4000/v1"),
  llmGatewayApiKey: z.string().optional(),
  llmModelClassifier: z.string().default("classifier"),
  llmModelExtractor: z.string().default("extractor"),
  llmModelProfiler: z.string().default("profiler"),
  llmModelWriter: z.string().default("writer"),
  llmModelProposalWriter: z.string().default("proposal_writer"),
  llmModelContentWriter: z.string().default("content_writer"),
  llmModelCoder: z.string().default("coder"),
  llmModelJudge: z.string().default("judge"),
  llmModelEmbedding: z.string().default("embedding"),
  internalApiToken: z.string().optional(),
  enableRealOutreach: envBoolean.default(false),
  enableProductionDeploy: envBoolean.default(false),
  enableCodexHandoff: envBoolean.default(false)
});

export type Settings = z.infer<typeof settingsSchema>;

export function getSettings(env: NodeJS.ProcessEnv = process.env): Settings {
  return settingsSchema.parse({
    appEnv: env.APP_ENV,
    appName: env.APP_NAME,
    appVersion: env.APP_VERSION,
    logLevel: env.LOG_LEVEL,
    apiHost: env.API_HOST,
    apiPort: env.API_PORT,
    corsOrigins: env.CORS_ORIGINS,
    databaseUrl: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    redisUrl: env.REDIS_URL,
    workerQueueMode: env.WORKER_QUEUE_MODE,
    workerQueueName: env.WORKER_QUEUE_NAME,
    dataStore: env.DATA_STORE,
    llmMode: env.LLM_MODE,
    llmGatewayBaseUrl: env.LLM_GATEWAY_BASE_URL,
    llmGatewayApiKey: env.LLM_GATEWAY_API_KEY,
    llmModelClassifier: env.LLM_MODEL_CLASSIFIER,
    llmModelExtractor: env.LLM_MODEL_EXTRACTOR,
    llmModelProfiler: env.LLM_MODEL_PROFILER,
    llmModelWriter: env.LLM_MODEL_WRITER,
    llmModelProposalWriter: env.LLM_MODEL_PROPOSAL_WRITER,
    llmModelContentWriter: env.LLM_MODEL_CONTENT_WRITER,
    llmModelCoder: env.LLM_MODEL_CODER,
    llmModelJudge: env.LLM_MODEL_JUDGE,
    llmModelEmbedding: env.LLM_MODEL_EMBEDDING,
    internalApiToken: env.INTERNAL_API_TOKEN,
    enableRealOutreach: env.ENABLE_REAL_OUTREACH,
    enableProductionDeploy: env.ENABLE_PRODUCTION_DEPLOY,
    enableCodexHandoff: env.ENABLE_CODEX_HANDOFF
  });
}

export function databaseConfigured(settings: Settings): boolean {
  return Boolean(settings.databaseUrl);
}

export type ConnectionKind = "unset" | "local" | "supabase" | "external" | "invalid";

export function databaseConnectionKind(settings: Settings): ConnectionKind {
  return connectionKind(settings.databaseUrl);
}

export function databaseIsLocal(settings: Settings): boolean {
  return databaseConnectionKind(settings) === "local";
}

export function supabaseConfigured(settings: Settings): boolean {
  return Boolean(settings.supabaseUrl);
}

export function supabaseConnectionKind(settings: Settings): ConnectionKind {
  return connectionKind(settings.supabaseUrl);
}

export function supabaseIsLocal(settings: Settings): boolean {
  return supabaseConnectionKind(settings) === "local";
}

export function llmModelAliases(settings: Settings): Record<string, string> {
  return {
    classifier: settings.llmModelClassifier,
    extractor: settings.llmModelExtractor,
    profiler: settings.llmModelProfiler,
    writer: settings.llmModelWriter,
    proposal_writer: settings.llmModelProposalWriter,
    content_writer: settings.llmModelContentWriter,
    coder: settings.llmModelCoder,
    judge: settings.llmModelJudge,
    embedding: settings.llmModelEmbedding
  };
}

export function redactConnectionUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    if (url.password) url.password = "redacted";
    return url.toString();
  } catch {
    return undefined;
  }
}

function connectionKind(rawUrl: string | undefined): ConnectionKind {
  if (!rawUrl) return "unset";

  try {
    const url = new URL(rawUrl);
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return "local";
    if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.com")) {
      return "supabase";
    }
    return "external";
  } catch {
    return "invalid";
  }
}
