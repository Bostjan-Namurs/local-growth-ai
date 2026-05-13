import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKER_QUEUE_NAME,
  LocalWorkerQueue,
  createWorkerQueue,
  loadWorkerQueueConfig
} from "../src/queue.js";
import { acceptLocalWorkerJob, workerHealth, workerStatus } from "../src/worker.js";

describe("worker queue foundation", () => {
  it("reports deterministic local health without queue connections", () => {
    expect(workerHealth({})).toMatchObject({
      status: "ok",
      queueIntegration: "local",
      queueName: DEFAULT_WORKER_QUEUE_NAME,
      redisConfigured: false,
      llmMode: "fake",
      message: "LocalGrowth worker queue foundation is ready in fake LLM mode."
    });
    expect(workerHealth({}).allowedJobs).toEqual([
      "source_compliance_check",
      "business_profile_generate",
      "proposal_generate",
      "app_spec_generate",
      "preview_build_stub"
    ]);
  });

  it("loads explicit Redis queue configuration without connecting", () => {
    expect(
      loadWorkerQueueConfig({
        WORKER_QUEUE_MODE: "redis",
        WORKER_QUEUE_NAME: "localgrowth.test",
        REDIS_URL: "redis://localhost:6379/0"
      })
    ).toEqual({
      mode: "redis",
      queueName: "localgrowth.test",
      redisUrl: "redis://localhost:6379/0"
    });

    expect(workerHealth({ WORKER_QUEUE_MODE: "redis", REDIS_URL: "redis://localhost:6379/0" })).toMatchObject({
      queueIntegration: "redis",
      redisConfigured: true
    });
  });

  it("rejects invalid queue mode and missing Redis URL", async () => {
    expect(() => loadWorkerQueueConfig({ WORKER_QUEUE_MODE: "sidekiq" })).toThrow(
      "WORKER_QUEUE_MODE must be local or redis"
    );

    await expect(createWorkerQueue({ mode: "redis", queueName: "localgrowth.test" })).rejects.toThrow(
      "REDIS_URL is required when WORKER_QUEUE_MODE=redis"
    );
  });

  it("reports queue readiness in worker status", () => {
    expect(workerStatus()).toContain("queue foundation is ready");
  });

  it("accepts only fake-mode local jobs", () => {
    expect(
      acceptLocalWorkerJob({
        name: "proposal_generate",
        llmMode: "fake",
        payload: { business_id: "business-1" }
      })
    ).toMatchObject({
      status: "accepted",
      jobName: "proposal_generate",
      queueIntegration: "local",
      llmMode: "fake"
    });

    expect(
      acceptLocalWorkerJob({
        name: "proposal_generate",
        llmMode: "gateway",
        payload: { business_id: "business-1" }
      })
    ).toMatchObject({
      status: "rejected",
      reason: "Worker jobs must use LLM_MODE=fake during Sprint 2"
    });
  });

  it("queues accepted jobs in local mode", async () => {
    const queue = new LocalWorkerQueue("localgrowth.test");

    await expect(
      queue.enqueue({
        name: "source_compliance_check",
        llmMode: "fake",
        payload: { source_record_id: "source-1" }
      })
    ).resolves.toMatchObject({
      status: "accepted",
      queueIntegration: "local",
      queueId: "localgrowth.test:1"
    });

    expect(queue.listQueuedJobs()).toEqual([
      {
        id: "localgrowth.test:1",
        name: "source_compliance_check",
        payload: { source_record_id: "source-1" },
        queueIntegration: "local",
        enqueuedAt: new Date(0).toISOString()
      }
    ]);

    await queue.close();
    expect(queue.listQueuedJobs()).toEqual([]);
  });

  it("rejects invalid payloads before local enqueue", async () => {
    const queue = new LocalWorkerQueue("localgrowth.test");

    await expect(
      queue.enqueue({
        name: "proposal_generate",
        llmMode: "fake",
        payload: { proposal_id: "wrong-shape" }
      })
    ).resolves.toMatchObject({
      status: "rejected",
      reason: "Invalid payload for worker job proposal_generate: business_id Required"
    });

    expect(queue.listQueuedJobs()).toEqual([]);
  });

  it("blocks prohibited or approval-gated jobs", () => {
    expect(
      acceptLocalWorkerJob({
        name: "automatic_outreach_send" as never,
        payload: { campaign_id: "campaign-1" }
      })
    ).toMatchObject({
      status: "rejected",
      reason: "Worker job is prohibited in Sprint 2: automatic_outreach_send"
    });

    expect(
      acceptLocalWorkerJob({
        name: "app_spec_generate",
        payload: { proposal_id: "proposal-1" }
      })
    ).toMatchObject({
      status: "rejected",
      reason: "App spec generation requires stored approval before worker execution"
    });
  });
});
