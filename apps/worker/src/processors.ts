import { stableHash } from "./hash.js";
import { validateWorkerJob, type WorkerJob, type WorkerJobName, type WorkerQueueIntegration } from "./jobs.js";

export type WorkerProcessorStatus = "completed" | "rejected";
export type WorkerApprovalStatus = "not_required" | "approved";
export type WorkerModelAlias = "classifier" | "profiler" | "proposal_writer" | "coder";

export interface WorkerAuditEvent {
  eventType: "worker_job_completed" | "worker_job_rejected";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WorkerProcessResult {
  status: WorkerProcessorStatus;
  jobName?: WorkerJobName;
  reason?: string;
  queueIntegration: WorkerQueueIntegration;
  llmMode: "fake";
  modelAlias: WorkerModelAlias;
  approvalStatus: WorkerApprovalStatus;
  inputHash: string;
  outputHash: string;
  output: Record<string, unknown>;
  auditEvent: WorkerAuditEvent;
  completedAt: string;
}

const workerModelAliases = {
  source_compliance_check: "classifier",
  business_profile_generate: "profiler",
  proposal_generate: "proposal_writer",
  app_spec_generate: "coder",
  preview_build_stub: "coder"
} satisfies Record<WorkerJobName, WorkerModelAlias>;

export function processWorkerJob(job: WorkerJob, queueIntegration: WorkerQueueIntegration = "local"): WorkerProcessResult {
  const completedAt = new Date(0).toISOString();
  const validation = validateWorkerJob(job, queueIntegration);
  const modelAlias = job.name in workerModelAliases ? workerModelAliases[job.name as WorkerJobName] : "classifier";
  const inputHash = stableHash(job);

  if (validation.status === "rejected") {
    const output = {
      rejected: true,
      reason: validation.reason
    };

    return buildProcessResult({
      status: "rejected",
      reason: validation.reason,
      jobName: validation.jobName,
      queueIntegration,
      modelAlias,
      approvalStatus: "not_required",
      inputHash,
      output,
      completedAt
    });
  }

  const output = buildStubOutput(job);

  return buildProcessResult({
    status: "completed",
    jobName: job.name,
    queueIntegration,
    modelAlias,
    approvalStatus: job.name === "app_spec_generate" ? "approved" : "not_required",
    inputHash,
    output,
    completedAt
  });
}

function buildStubOutput(job: WorkerJob): Record<string, unknown> {
  switch (job.name) {
    case "source_compliance_check":
      return {
        compliance_status: "requires_review",
        source_record_id: job.payload.source_record_id,
        allowed_use: "unknown",
        missing_data: ["source_license", "allowed_use"],
        next_action: "human_review_required"
      };
    case "business_profile_generate":
      return {
        profile_status: "stubbed",
        business_id: job.payload.business_id,
        generated_facts: [],
        missing_data: ["customer_facts", "website_audit"]
      };
    case "proposal_generate":
      return {
        proposal_status: "stubbed",
        business_id: job.payload.business_id,
        generated_claims: [],
        missing_data: ["approved_offer", "pricing", "customer_facts"]
      };
    case "app_spec_generate":
      return {
        app_spec_status: "stubbed",
        proposal_id: job.payload.proposal_id,
        generated_code: false,
        requires_approved_template: true
      };
    case "preview_build_stub":
      return {
        preview_status: "stubbed",
        app_spec_id: job.payload.app_spec_id,
        deployed: false
      };
  }
}

function buildProcessResult(args: {
  status: WorkerProcessorStatus;
  jobName?: WorkerJobName;
  reason?: string;
  queueIntegration: WorkerQueueIntegration;
  modelAlias: WorkerModelAlias;
  approvalStatus: WorkerApprovalStatus;
  inputHash: string;
  output: Record<string, unknown>;
  completedAt: string;
}): WorkerProcessResult {
  const outputHash = stableHash(args.output);
  const auditEvent: WorkerAuditEvent = {
    eventType: args.status === "completed" ? "worker_job_completed" : "worker_job_rejected",
    payload: {
      job_name: args.jobName,
      status: args.status,
      reason: args.reason,
      queue_integration: args.queueIntegration,
      llm_mode: "fake",
      model_alias: args.modelAlias,
      approval_status: args.approvalStatus,
      input_hash: args.inputHash,
      output_hash: outputHash
    },
    createdAt: args.completedAt
  };

  return {
    status: args.status,
    jobName: args.jobName,
    reason: args.reason,
    queueIntegration: args.queueIntegration,
    llmMode: "fake",
    modelAlias: args.modelAlias,
    approvalStatus: args.approvalStatus,
    inputHash: args.inputHash,
    outputHash,
    output: args.output,
    auditEvent,
    completedAt: args.completedAt
  };
}
