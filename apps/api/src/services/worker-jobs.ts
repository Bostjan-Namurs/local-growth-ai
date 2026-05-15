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
  queueIntegration: "local";
  queueName: string;
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

export class WorkerJobService {
  public constructor(
    private readonly agentRuns: AgentRunLogger,
    private readonly settings: Settings
  ) {}

  public async enqueue(input: EnqueueWorkerJobInput): Promise<WorkerJobEnqueueResponse> {
    const jobName = input.name as WorkerJobName;
    const modelAlias = workerModelAliases[jobName];
    const approvalStatus: ApprovalStatus = jobName === "app_spec_generate" ? "approved" : "not_required";
    const queueIntegration = "local" as const;
    const inputHash = stableHash({
      name: jobName,
      payload: input.payload,
      llmMode: "fake",
      requiresApproval: input.requiresApproval === true
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
        payload: input.payload,
        requires_approval: input.requiresApproval === true
      }
    });

    return {
      worker_job: {
        id: run.id,
        status: "queued",
        jobName,
        queueIntegration,
        queueName: this.settings.workerQueueName,
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
}

export function createWorkerJobService(agentRuns: AgentRunLogger, settings: Settings): WorkerJobService {
  return new WorkerJobService(agentRuns, settings);
}
