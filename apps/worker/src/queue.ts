import type { ConnectionOptions, Queue as BullMqQueue } from "bullmq";
import {
  validateWorkerJob,
  type WorkerJob,
  type WorkerJobName,
  type WorkerJobResult,
  type WorkerQueueIntegration
} from "./jobs.js";

export const DEFAULT_WORKER_QUEUE_NAME = "localgrowth.worker";

export type WorkerQueueMode = "local" | "redis";

export interface WorkerQueueConfig {
  mode: WorkerQueueMode;
  queueName: string;
  redisUrl?: string;
}

export interface QueuedWorkerJob {
  id: string;
  name: WorkerJobName;
  payload: Record<string, unknown>;
  queueIntegration: WorkerQueueIntegration;
  enqueuedAt: string;
}

export interface WorkerEnqueueResult extends WorkerJobResult {
  queueId?: string;
}

export interface WorkerQueueClient {
  readonly queueIntegration: WorkerQueueIntegration;
  enqueue(job: WorkerJob): Promise<WorkerEnqueueResult>;
  close(): Promise<void>;
}

type Env = Record<string, string | undefined>;

export function loadWorkerQueueConfig(env: Env = process.env): WorkerQueueConfig {
  const mode = env.WORKER_QUEUE_MODE ?? "local";

  if (mode !== "local" && mode !== "redis") {
    throw new Error("WORKER_QUEUE_MODE must be local or redis");
  }

  return {
    mode,
    queueName: env.WORKER_QUEUE_NAME ?? DEFAULT_WORKER_QUEUE_NAME,
    redisUrl: env.REDIS_URL
  };
}

export class LocalWorkerQueue implements WorkerQueueClient {
  public readonly queueIntegration = "local";
  private readonly queuedJobs: QueuedWorkerJob[] = [];

  public constructor(private readonly queueName = DEFAULT_WORKER_QUEUE_NAME) {}

  public async enqueue(job: WorkerJob): Promise<WorkerEnqueueResult> {
    const result = validateWorkerJob(job, this.queueIntegration);

    if (result.status === "rejected") {
      return result;
    }

    const queueId = `${this.queueName}:${this.queuedJobs.length + 1}`;
    this.queuedJobs.push({
      id: queueId,
      name: job.name,
      payload: job.payload,
      queueIntegration: this.queueIntegration,
      enqueuedAt: result.acceptedAt
    });

    return {
      ...result,
      queueId
    };
  }

  public listQueuedJobs(): QueuedWorkerJob[] {
    return this.queuedJobs.map((job) => ({ ...job, payload: { ...job.payload } }));
  }

  public async close(): Promise<void> {
    this.queuedJobs.length = 0;
  }
}

export class RedisWorkerQueue implements WorkerQueueClient {
  public readonly queueIntegration = "redis";

  public constructor(private readonly queue: BullMqQueue) {}

  public async enqueue(job: WorkerJob): Promise<WorkerEnqueueResult> {
    const result = validateWorkerJob(job, this.queueIntegration);

    if (result.status === "rejected") {
      return result;
    }

    const queuedJob = await this.queue.add(job.name, {
      llmMode: "fake",
      payload: job.payload,
      requiresApproval: job.requiresApproval === true
    });

    return {
      ...result,
      queueId: queuedJob.id
    };
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}

export async function createWorkerQueue(config: WorkerQueueConfig = loadWorkerQueueConfig()): Promise<WorkerQueueClient> {
  if (config.mode === "local") {
    return new LocalWorkerQueue(config.queueName);
  }

  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required when WORKER_QUEUE_MODE=redis");
  }

  const { Queue } = await import("bullmq");
  return new RedisWorkerQueue(new Queue(config.queueName, { connection: parseRedisConnection(config.redisUrl) }));
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
