import { listAllowedWorkerJobs, validateWorkerJob, type WorkerJob, type WorkerJobName } from "./jobs.js";
import { processWorkerJob } from "./processors.js";
import { loadWorkerQueueConfig, type WorkerQueueConfig } from "./queue.js";
import { createRedisWorkerConsumer, loadWorkerConsumerConfig } from "./consumer.js";

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

export function processLocalWorkerJob(job: WorkerJob) {
  return processWorkerJob(job, "local");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const consumerConfig = loadWorkerConsumerConfig();
  if (consumerConfig.mode === "redis") {
    await createRedisWorkerConsumer(consumerConfig);
    console.log(
      JSON.stringify(
        {
          ...workerHealth(),
          message: "LocalGrowth Redis worker consumer started in fake LLM mode."
        },
        null,
        2
      )
    );
  } else {
    console.log(JSON.stringify(workerHealth(), null, 2));
  }
}
