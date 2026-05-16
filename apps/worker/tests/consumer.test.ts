import { describe, expect, it } from "vitest";
import {
  createRedisWorkerConsumer,
  loadWorkerConsumerConfig,
  processQueuedWorkerJob,
  workerResultUrl,
  type WorkerResultReport,
  type WorkerResultReporter
} from "../src/consumer.js";

class RecordingReporter implements WorkerResultReporter {
  public reports: Array<{ agentRunId: string; report: WorkerResultReport }> = [];

  async reportResult(agentRunId: string, report: WorkerResultReport): Promise<void> {
    this.reports.push({ agentRunId, report });
  }
}

describe("worker consumer", () => {
  it("loads local defaults without Redis or API connections", () => {
    expect(loadWorkerConsumerConfig({})).toEqual({
      mode: "local",
      queueName: "localgrowth.worker",
      redisUrl: undefined,
      apiBaseUrl: "http://localhost:8000",
      internalApiToken: undefined
    });
  });

  it("builds stable internal result URLs", () => {
    expect(workerResultUrl("http://localhost:8000/", "run/1")).toBe(
      "http://localhost:8000/internal/worker-jobs/run%2F1/result"
    );
  });

  it("processes BullMQ job data and reports deterministic stub results", async () => {
    const reporter = new RecordingReporter();
    const result = await processQueuedWorkerJob(
      {
        agentRunId: "run-1",
        name: "business_profile_generate",
        payload: { business_id: "business-1" },
        llmMode: "fake",
        requiresApproval: false
      },
      reporter
    );

    expect(result).toMatchObject({
      status: "completed",
      jobName: "business_profile_generate",
      queueIntegration: "redis",
      llmMode: "fake",
      modelAlias: "profiler"
    });
    expect(reporter.reports).toEqual([
      {
        agentRunId: "run-1",
        report: {
          status: "completed",
          output: {
            profile_status: "stubbed",
            business_id: "business-1",
            generated_facts: [],
            missing_data: ["customer_facts", "website_audit"]
          },
          outputHash: result.outputHash,
          error: undefined,
          auditEvent: result.auditEvent
        }
      }
    ]);
  });

  it("refuses jobs without an agentRunId", async () => {
    const reporter = new RecordingReporter();

    await expect(
      processQueuedWorkerJob(
        {
          name: "proposal_generate",
          payload: { business_id: "business-1" },
          llmMode: "fake"
        },
        reporter
      )
    ).rejects.toThrow("Required");
    expect(reporter.reports).toEqual([]);
  });

  it("keeps non-fake jobs blocked before reporting", async () => {
    const reporter = new RecordingReporter();

    await expect(
      processQueuedWorkerJob(
        {
          agentRunId: "run-1",
          name: "proposal_generate",
          payload: { business_id: "business-1" },
          llmMode: "gateway"
        },
        reporter
      )
    ).rejects.toThrow("Invalid literal value");
    expect(reporter.reports).toEqual([]);
  });

  it("keeps approval-gated jobs blocked and reports failure metadata", async () => {
    const reporter = new RecordingReporter();
    const result = await processQueuedWorkerJob(
      {
        agentRunId: "run-2",
        name: "app_spec_generate",
        payload: { proposal_id: "proposal-1" },
        llmMode: "fake"
      },
      reporter
    );

    expect(result).toMatchObject({
      status: "rejected",
      reason: "App spec generation requires stored approval before worker execution"
    });
    expect(reporter.reports[0]).toMatchObject({
      agentRunId: "run-2",
      report: {
        status: "failed",
        error: "App spec generation requires stored approval before worker execution",
        auditEvent: {
          eventType: "worker_job_rejected"
        }
      }
    });
  });

  it("requires explicit Redis config and internal token before starting a live consumer", async () => {
    await expect(createRedisWorkerConsumer(loadWorkerConsumerConfig({}))).rejects.toThrow(
      "WORKER_QUEUE_MODE=redis is required to start the Redis worker consumer"
    );
    await expect(
      createRedisWorkerConsumer(
        loadWorkerConsumerConfig({
          WORKER_QUEUE_MODE: "redis",
          REDIS_URL: "redis://localhost:6379/0"
        })
      )
    ).rejects.toThrow("INTERNAL_API_TOKEN is required to start the Redis worker consumer");
  });
});
