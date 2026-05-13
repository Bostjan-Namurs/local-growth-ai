import { listAllowedWorkerJobs, validateWorkerJob, type WorkerJob, type WorkerJobName } from "./jobs.js";
import { loadWorkerQueueConfig, type WorkerQueueConfig } from "./queue.js";

export interface WorkerHealth {
  status: "ok";
  queueIntegration: WorkerQueueConfig["mode"];
  queueName: string;
  redisConfigured: boolean;
  llmMode: "fake";
  allowedJobs: WorkerJobName[];
  message: string;
}

export function workerHealth(env: Record<string, string | undefined> = process.env): WorkerHealth {
  const queueConfig = loadWorkerQueueConfig(env);

  return {
    status: "ok",
    queueIntegration: queueConfig.mode,
    queueName: queueConfig.queueName,
    redisConfigured: Boolean(queueConfig.redisUrl),
    llmMode: "fake",
    allowedJobs: listAllowedWorkerJobs(),
    message: "LocalGrowth worker queue foundation is ready in fake LLM mode."
  };
}

export function workerStatus(): string {
  return workerHealth().message;
}

export function acceptLocalWorkerJob(job: WorkerJob) {
  return validateWorkerJob(job, "local");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(workerHealth(), null, 2));
}
