import { listAllowedWorkerJobs, validateWorkerJob, type WorkerJob, type WorkerJobName } from "./jobs.js";

export interface WorkerHealth {
  status: "ok";
  queueIntegration: "deferred";
  llmMode: "fake";
  allowedJobs: WorkerJobName[];
  message: string;
}

export function workerHealth(): WorkerHealth {
  return {
    status: "ok",
    queueIntegration: "deferred",
    llmMode: "fake",
    allowedJobs: listAllowedWorkerJobs(),
    message: "LocalGrowth worker scaffold is ready. BullMQ/Redis processing is deferred from Sprint 1."
  };
}

export function workerStatus(): string {
  return workerHealth().message;
}

export function acceptLocalWorkerJob(job: WorkerJob) {
  return validateWorkerJob(job);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(workerHealth(), null, 2));
}
