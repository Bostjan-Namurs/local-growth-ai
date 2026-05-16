import type { ConnectionOptions, Queue as BullMqQueue } from "bullmq";
import { z } from "zod";
import { stableHash } from "../agents/hash.js";
import { type AgentRun, type AgentRunLogger, type ApprovalStatus } from "../agents/run-logger.js";
import { type Settings } from "../config.js";

export const workerJobNames = [
  "source_compliance_check",
  "business_profile_generate",
  "proposal_generate",
  "app_spec_generate",
  "preview_build_stub"
] as const;

export type WorkerJobName = (typeof workerJobNames)[number];
export type WorkerJobModelAlias = "classifier" | "profiler" | "proposal_writer" | "coder";
export type WorkerQueueIntegration = "local" | "redis";

const prohibitedWorkerJobNames = new Set(["automatic_outreach_send", "production_deploy", "real_llm_call"]);
const workerJobNameSet = new Set<string>(workerJobNames);
const idSchema = z.string().min(1);

const workerPayloadSchemas = {
  source_compliance_check: z.object({ source_record_id: idSchema }).strict(),
  business_profile_generate: z.object({ business_id: idSchema }).strict(),
  proposal_generate: z.object({ business_id: idSchema }).strict(),
  app_spec_generate: z.object({ proposal_id: idSchema }).strict(),
  preview_build_stub: z.object({ app_spec_id: idSchema }).strict()
} satisfies Record<WorkerJobName, z.ZodType<Record<string, unknown>>>;

const workerModelAliases = {
  source_compliance_check: "classifier",
  business_profile_generate: "profiler",
  proposal_generate: "proposal_writer",
  app_spec_generate: "coder",
  preview_build_stub: "coder"
} satisfies Record<WorkerJobName, WorkerJobModelAlias>;

export const enqueueWorkerJobSchema = z
  .object({
    name: z.string(),
    payload: z.record(z.unknown()).default({}),
    llmMode: z.literal("fake").default("fake"),
    requiresApproval: z.boolean().optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (prohibitedWorkerJobNames.has(value.name)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: `Worker job is prohibited: ${value.name}`
      });
      return;
    }

    if (!workerJobNameSet.has(value.name)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: `Unknown worker job: ${value.name}`
      });
      return;
    }

    const jobName = value.name as WorkerJobName;
    if (jobName === "app_spec_generate" && value.requiresApproval !== true) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresApproval"],
        message: "App spec generation requires stored approval before enqueue"
      });
    }

    const payloadResult = workerPayloadSchemas[jobName].safeParse(value.payload);
    if (!payloadResult.success) {
      const firstIssue = payloadResult.error.issues[0];
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload"],
        message: firstIssue?.message ?? "Invalid worker job payload"
      });
    }
  });

export type EnqueueWorkerJobInput = z.infer<typeof enqueueWorkerJobSchema>;

export const workerJobResultSchema = z
  .object({
    status: z.enum(["completed", "failed", "needs_review"]),
    output: z.record(z.unknown()).default({}),
    outputHash: z.string().min(1).optional(),
    error: z.string().optional(),
    auditEvent: z
      .object({
        eventType: z.string().min(1),
        payload: z.record(z.unknown()).default({}),
        createdAt: z.string().optional()
      })
      .optional()
  })
  .strict();

export type WorkerJobResultInput = z.infer<typeof workerJobResultSchema>;

export interface QueuedWorkerJobResponse {
  id: string;
  status: "queued";
  jobName: WorkerJobName;
  queueIntegration: WorkerQueueIntegration;
  queueName: string;
  queueId?: string;
  llmMode: "fake";
  modelAlias: WorkerJobModelAlias;
  approvalStatus: ApprovalStatus;
  inputHash: string;
  agentRunId: string;
  auditEvent: Record<string, unknown>;
}

export interface WorkerJobEnqueueResponse {
  worker_job: QueuedWorkerJobResponse;
  agent_run: AgentRun;
}

export interface WorkerJobResultResponse {
  worker_job: {
    id: string;
    status: WorkerJobResultInput["status"];
    outputHash: string;
    agentRunId: string;
  };
  agent_run: AgentRun;
}

export interface WorkerQueuePublishPayload {
  agentRunId: string;
  jobName: WorkerJobName;
  payload: Record<string, unknown>;
  llmMode: "fake";
  requiresApproval: boolean;
  inputHash: string;
  modelAlias: WorkerJobModelAlias;
  approvalStatus: ApprovalStatus;
}

export interface WorkerQueuePublisher {
  publish(payload: WorkerQueuePublishPayload): Promise<{ queueId?: string }>;
  close?(): Promise<void>;
}

export class WorkerJobService {
  private queuePublisher?: WorkerQueuePublisher;

  public constructor(
    private readonly agentRuns: AgentRunLogger,
    private readonly settings: Settings,
    queuePublisher?: WorkerQueuePublisher
  ) {
    this.queuePublisher = queuePublisher;
  }

  public async enqueue(input: EnqueueWorkerJobInput): Promise<WorkerJobEnqueueResponse> {
    const parsed = enqueueWorkerJobSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? parsed.error.message);
    }

    const job = parsed.data;
    const jobName = job.name as WorkerJobName;
    const modelAlias = workerModelAliases[jobName];
    const approvalStatus: ApprovalStatus = jobName === "app_spec_generate" ? "approved" : "not_required";
    const queueIntegration = this.settings.workerQueueMode;

    if (queueIntegration === "redis" && !this.settings.redisUrl) {
      throw new Error("REDIS_URL is required when WORKER_QUEUE_MODE=redis");
    }

    const inputHash = stableHash({
      name: jobName,
      payload: job.payload,
      llmMode: "fake",
      requiresApproval: job.requiresApproval === true
    });

    const run = await this.agentRuns.queue({
      agentName: `Worker:${jobName}`,
      inputHash,
      modelAlias,
      approvalStatus,
      metadata: {
        workflow: "worker_enqueue",
        job_name: jobName,
        queue_integration: queueIntegration,
        queue_name: this.settings.workerQueueName,
        llm_mode: "fake",
        payload: job.payload,
        requires_approval: job.requiresApproval === true
      }
    });

    let queueId: string | undefined;
    if (queueIntegration === "redis") {
      try {
        const publishResult = await this.getQueuePublisher().publish({
          agentRunId: run.id,
          jobName,
          payload: job.payload,
          llmMode: "fake",
          requiresApproval: job.requiresApproval === true,
          inputHash,
          modelAlias,
          approvalStatus
        });
        queueId = publishResult.queueId;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown worker queue publish error";
        await this.agentRuns.fail(run.id, message);
        throw error;
      }
    }

    return {
      worker_job: {
        id: run.id,
        status: "queued",
        jobName,
        queueIntegration,
        queueName: this.settings.workerQueueName,
        queueId,
        llmMode: "fake",
        modelAlias,
        approvalStatus,
        inputHash,
        agentRunId: run.id,
        auditEvent: this.agentRuns.toLogEvent(run)
      },
      agent_run: run
    };
  }

  public async recordResult(runId: string, input: WorkerJobResultInput): Promise<WorkerJobResultResponse> {
    const outputHash = input.outputHash ?? stableHash(input.output);
    const run = await this.agentRuns.finish({
      runId,
      outputHash,
      status: input.status,
      metadata: {
        worker_result: {
          status: input.status,
          output: input.output,
          error: input.error
        },
        worker_audit_event: input.auditEvent
      }
    });

    return {
      worker_job: {
        id: run.id,
        status: input.status,
        outputHash,
        agentRunId: run.id
      },
      agent_run: run
    };
  }

  public async close(): Promise<void> {
    await this.queuePublisher?.close?.();
  }

  private getQueuePublisher(): WorkerQueuePublisher {
    this.queuePublisher ??= new BullMqWorkerQueuePublisher(this.settings);
    return this.queuePublisher;
  }
}

export function createWorkerJobService(agentRuns: AgentRunLogger, settings: Settings): WorkerJobService {
  return new WorkerJobService(agentRuns, settings);
}

export class BullMqWorkerQueuePublisher implements WorkerQueuePublisher {
  private queue?: BullMqQueue;

  public constructor(private readonly settings: Settings) {}

  public async publish(payload: WorkerQueuePublishPayload): Promise<{ queueId?: string }> {
    const queue = await this.getQueue();
    const job = await queue.add(payload.jobName, {
      agentRunId: payload.agentRunId,
      name: payload.jobName,
      payload: payload.payload,
      llmMode: payload.llmMode,
      requiresApproval: payload.requiresApproval,
      inputHash: payload.inputHash,
      modelAlias: payload.modelAlias,
      approvalStatus: payload.approvalStatus
    });

    return { queueId: job.id };
  }

  public async close(): Promise<void> {
    await this.queue?.close();
  }

  private async getQueue(): Promise<BullMqQueue> {
    if (this.queue) return this.queue;
    if (!this.settings.redisUrl) {
      throw new Error("REDIS_URL is required when WORKER_QUEUE_MODE=redis");
    }

    const { Queue } = await import("bullmq");
    this.queue = new Queue(this.settings.workerQueueName, {
      connection: parseRedisConnection(this.settings.redisUrl)
    });
    return this.queue;
  }
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
