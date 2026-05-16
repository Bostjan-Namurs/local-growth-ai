import type { ConnectionOptions, Worker as BullMqWorker } from "bullmq";
import { z } from "zod";
import { processWorkerJob, type WorkerProcessResult } from "./processors.js";
import { DEFAULT_WORKER_QUEUE_NAME, type WorkerQueueMode } from "./queue.js";
import { type WorkerJob, type WorkerJobName } from "./jobs.js";

export interface WorkerConsumerConfig {
  mode: WorkerQueueMode;
  queueName: string;
  redisUrl?: string;
  apiBaseUrl: string;
  internalApiToken?: string;
}

export interface WorkerResultReport {
  status: "completed" | "failed" | "needs_review";
  output: Record<string, unknown>;
  outputHash: string;
  error?: string;
  auditEvent: {
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: string;
  };
}

export interface WorkerResultReporter {
  reportResult(agentRunId: string, report: WorkerResultReport): Promise<void>;
}

const workerQueueJobSchema = z
  .object({
    agentRunId: z.string().min(1),
    name: z.enum([
      "source_compliance_check",
      "business_profile_generate",
      "proposal_generate",
      "app_spec_generate",
      "preview_build_stub"
    ]),
    payload: z.record(z.unknown()).default({}),
    llmMode: z.literal("fake"),
    requiresApproval: z.boolean().optional()
  })
  .strict();

type WorkerQueueJobData = z.infer<typeof workerQueueJobSchema>;

type Env = Record<string, string | undefined>;

export function loadWorkerConsumerConfig(env: Env = process.env): WorkerConsumerConfig {
  const mode = env.WORKER_QUEUE_MODE ?? "local";

  if (mode !== "local" && mode !== "redis") {
    throw new Error("WORKER_QUEUE_MODE must be local or redis");
  }

  return {
    mode,
    queueName: env.WORKER_QUEUE_NAME ?? DEFAULT_WORKER_QUEUE_NAME,
    redisUrl: env.REDIS_URL,
    apiBaseUrl: env.API_BASE_URL ?? "http://localhost:8000",
    internalApiToken: env.INTERNAL_API_TOKEN
  };
}

export async function processQueuedWorkerJob(
  data: unknown,
  reporter: WorkerResultReporter
): Promise<WorkerProcessResult> {
  const parsed = workerQueueJobSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? parsed.error.message);
  }

  const job = toWorkerJob(parsed.data);
  const result = processWorkerJob(job, "redis");
  await reporter.reportResult(parsed.data.agentRunId, processResultToReport(result));
  return result;
}

export class InternalApiWorkerResultReporter implements WorkerResultReporter {
  public constructor(private readonly config: WorkerConsumerConfig) {}

  public async reportResult(agentRunId: string, report: WorkerResultReport): Promise<void> {
    if (!this.config.internalApiToken) {
      throw new Error("INTERNAL_API_TOKEN is required to report worker results");
    }

    const response = await fetch(workerResultUrl(this.config.apiBaseUrl, agentRunId), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-api-token": this.config.internalApiToken
      },
      body: JSON.stringify(report)
    });

    if (!response.ok) {
      throw new Error(`Worker result report failed with HTTP ${response.status}`);
    }
  }
}

export async function createRedisWorkerConsumer(
  config: WorkerConsumerConfig = loadWorkerConsumerConfig(),
  reporter: WorkerResultReporter = new InternalApiWorkerResultReporter(config)
): Promise<BullMqWorker> {
  if (config.mode !== "redis") {
    throw new Error("WORKER_QUEUE_MODE=redis is required to start the Redis worker consumer");
  }
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required when WORKER_QUEUE_MODE=redis");
  }
  if (!config.internalApiToken) {
    throw new Error("INTERNAL_API_TOKEN is required to start the Redis worker consumer");
  }

  const { Worker } = await import("bullmq");
  return new Worker(
    config.queueName,
    async (job) => {
      await processQueuedWorkerJob(job.data, reporter);
    },
    {
      connection: parseRedisConnection(config.redisUrl)
    }
  );
}

export function processResultToReport(result: WorkerProcessResult): WorkerResultReport {
  return {
    status: result.status === "completed" ? "completed" : "failed",
    output: result.output,
    outputHash: result.outputHash,
    error: result.reason,
    auditEvent: result.auditEvent
  };
}

export function workerResultUrl(apiBaseUrl: string, agentRunId: string): string {
  return `${apiBaseUrl.replace(/\/$/, "")}/internal/worker-jobs/${encodeURIComponent(agentRunId)}/result`;
}

function toWorkerJob(data: WorkerQueueJobData): WorkerJob {
  return {
    name: data.name as WorkerJobName,
    payload: data.payload,
    llmMode: data.llmMode,
    requiresApproval: data.requiresApproval
  };
}

function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const parsed = new URL(redisUrl);
  const dbPath = parsed.pathname.replace("/", "");

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: dbPath ? Number(dbPath) : 0,
    maxRetriesPerRequest: null
  };
}
