import { z } from "zod";

export type WorkerJobName =
  | "source_compliance_check"
  | "business_profile_generate"
  | "proposal_generate"
  | "app_spec_generate"
  | "preview_build_stub";

export type WorkerJobStatus = "accepted" | "rejected";
export type WorkerQueueIntegration = "local" | "redis";

export interface WorkerJob {
  name: WorkerJobName;
  payload: Record<string, unknown>;
  llmMode?: "fake" | "gateway";
  requiresApproval?: boolean;
}

export interface WorkerJobResult {
  status: WorkerJobStatus;
  jobName?: WorkerJobName;
  reason?: string;
  queueIntegration: WorkerQueueIntegration;
  llmMode: "fake";
  acceptedAt: string;
}

const allowedJobNames: WorkerJobName[] = [
  "source_compliance_check",
  "business_profile_generate",
  "proposal_generate",
  "app_spec_generate",
  "preview_build_stub"
];

const prohibitedJobNames = new Set(["automatic_outreach_send", "production_deploy", "real_llm_call"]);
const idSchema = z.string().min(1);

const workerJobPayloadSchemas = {
  source_compliance_check: z
    .object({
      source_record_id: idSchema
    })
    .strict(),
  business_profile_generate: z
    .object({
      business_id: idSchema
    })
    .strict(),
  proposal_generate: z
    .object({
      business_id: idSchema
    })
    .strict(),
  app_spec_generate: z
    .object({
      proposal_id: idSchema
    })
    .strict(),
  preview_build_stub: z
    .object({
      app_spec_id: idSchema
    })
    .strict()
} satisfies Record<WorkerJobName, z.ZodType<Record<string, unknown>>>;

export function listAllowedWorkerJobs(): WorkerJobName[] {
  return [...allowedJobNames];
}

export function validateWorkerJob(job: WorkerJob, queueIntegration: WorkerQueueIntegration = "local"): WorkerJobResult {
  const acceptedAt = new Date(0).toISOString();

  if (prohibitedJobNames.has(job.name)) {
    return {
      status: "rejected",
      reason: `Worker job is prohibited in Sprint 2: ${job.name}`,
      queueIntegration,
      llmMode: "fake",
      acceptedAt
    };
  }

  if (!allowedJobNames.includes(job.name)) {
    return {
      status: "rejected",
      reason: `Unknown worker job: ${job.name}`,
      queueIntegration,
      llmMode: "fake",
      acceptedAt
    };
  }

  if (job.llmMode && job.llmMode !== "fake") {
    return {
      status: "rejected",
      reason: "Worker jobs must use LLM_MODE=fake during Sprint 2",
      queueIntegration,
      llmMode: "fake",
      acceptedAt
    };
  }

  if (job.name === "app_spec_generate" && job.requiresApproval !== true) {
    return {
      status: "rejected",
      reason: "App spec generation requires stored approval before worker execution",
      queueIntegration,
      llmMode: "fake",
      acceptedAt
    };
  }

  const payloadResult = workerJobPayloadSchemas[job.name].safeParse(job.payload);
  if (!payloadResult.success) {
    const firstIssue = payloadResult.error.issues[0];
    const issuePath = firstIssue?.path.join(".") || "payload";

    return {
      status: "rejected",
      reason: `Invalid payload for worker job ${job.name}: ${issuePath} ${firstIssue?.message ?? "is invalid"}`,
      queueIntegration,
      llmMode: "fake",
      acceptedAt
    };
  }

  return {
    status: "accepted",
    jobName: job.name,
    queueIntegration,
    llmMode: "fake",
    acceptedAt
  };
}
