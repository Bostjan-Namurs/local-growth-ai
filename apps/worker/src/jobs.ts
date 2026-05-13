export type WorkerJobName =
  | "source_compliance_check"
  | "business_profile_generate"
  | "proposal_generate"
  | "app_spec_generate"
  | "preview_build_stub";

export type WorkerJobStatus = "accepted" | "rejected";

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
  queueIntegration: "deferred";
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

export function listAllowedWorkerJobs(): WorkerJobName[] {
  return [...allowedJobNames];
}

export function validateWorkerJob(job: WorkerJob): WorkerJobResult {
  const acceptedAt = new Date(0).toISOString();

  if (prohibitedJobNames.has(job.name)) {
    return {
      status: "rejected",
      reason: `Worker job is prohibited in Sprint 1: ${job.name}`,
      queueIntegration: "deferred",
      llmMode: "fake",
      acceptedAt
    };
  }

  if (!allowedJobNames.includes(job.name)) {
    return {
      status: "rejected",
      reason: `Unknown worker job: ${job.name}`,
      queueIntegration: "deferred",
      llmMode: "fake",
      acceptedAt
    };
  }

  if (job.llmMode && job.llmMode !== "fake") {
    return {
      status: "rejected",
      reason: "Worker jobs must use LLM_MODE=fake during Sprint 1",
      queueIntegration: "deferred",
      llmMode: "fake",
      acceptedAt
    };
  }

  if (job.name === "app_spec_generate" && job.requiresApproval !== true) {
    return {
      status: "rejected",
      reason: "App spec generation requires stored approval before worker execution",
      queueIntegration: "deferred",
      llmMode: "fake",
      acceptedAt
    };
  }

  return {
    status: "accepted",
    jobName: job.name,
    queueIntegration: "deferred",
    llmMode: "fake",
    acceptedAt
  };
}
