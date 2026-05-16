import { describe, expect, it } from "vitest";
import { InMemoryAgentRunLogger } from "../src/agents/run-logger.js";
import { getSettings } from "../src/config.js";
import {
  WorkerJobService,
  type WorkerQueuePublishPayload,
  type WorkerQueuePublisher
} from "../src/services/worker-jobs.js";

class RecordingQueuePublisher implements WorkerQueuePublisher {
  public published: WorkerQueuePublishPayload[] = [];

  async publish(payload: WorkerQueuePublishPayload): Promise<{ queueId: string }> {
    this.published.push(payload);
    return { queueId: `redis-job-${this.published.length}` };
  }
}

class FailingQueuePublisher implements WorkerQueuePublisher {
  async publish(): Promise<{ queueId: string }> {
    throw new Error("publisher should not be called");
  }
}

describe("worker job service queue publishing", () => {
  it("keeps local mode metadata-only without calling the queue publisher", async () => {
    const logger = new InMemoryAgentRunLogger();
    const service = new WorkerJobService(
      logger,
      getSettings({
        WORKER_QUEUE_MODE: "local",
        WORKER_QUEUE_NAME: "localgrowth.local"
      }),
      new FailingQueuePublisher()
    );

    await expect(
      service.enqueue({
        name: "proposal_generate",
        payload: { business_id: "business-1" },
        llmMode: "fake"
      })
    ).resolves.toMatchObject({
      worker_job: {
        status: "queued",
        jobName: "proposal_generate",
        queueIntegration: "local",
        queueName: "localgrowth.local",
        queueId: undefined
      }
    });
  });

  it("publishes Redis-mode jobs with agent run identity and fake-mode payload", async () => {
    const logger = new InMemoryAgentRunLogger();
    const publisher = new RecordingQueuePublisher();
    const service = new WorkerJobService(
      logger,
      getSettings({
        WORKER_QUEUE_MODE: "redis",
        WORKER_QUEUE_NAME: "localgrowth.redis",
        REDIS_URL: "redis://localhost:6379/0"
      }),
      publisher
    );

    const result = await service.enqueue({
      name: "proposal_generate",
      payload: { business_id: "business-1" },
      llmMode: "fake"
    });

    expect(result.worker_job).toMatchObject({
      status: "queued",
      jobName: "proposal_generate",
      queueIntegration: "redis",
      queueName: "localgrowth.redis",
      queueId: "redis-job-1",
      llmMode: "fake",
      modelAlias: "proposal_writer"
    });
    expect(publisher.published).toEqual([
      {
        agentRunId: result.worker_job.agentRunId,
        jobName: "proposal_generate",
        payload: { business_id: "business-1" },
        llmMode: "fake",
        requiresApproval: false,
        inputHash: result.worker_job.inputHash,
        modelAlias: "proposal_writer",
        approvalStatus: "not_required"
      }
    ]);
  });

  it("requires REDIS_URL before creating audit rows in Redis mode", async () => {
    const logger = new InMemoryAgentRunLogger();
    const service = new WorkerJobService(
      logger,
      getSettings({
        WORKER_QUEUE_MODE: "redis"
      }),
      new RecordingQueuePublisher()
    );

    await expect(
      service.enqueue({
        name: "source_compliance_check",
        payload: { source_record_id: "source-1" },
        llmMode: "fake"
      })
    ).rejects.toThrow("REDIS_URL is required when WORKER_QUEUE_MODE=redis");

    expect(logger.list()).toEqual([]);
  });

  it("rejects prohibited jobs before queue publishing or audit writes", async () => {
    const logger = new InMemoryAgentRunLogger();
    const publisher = new RecordingQueuePublisher();
    const service = new WorkerJobService(
      logger,
      getSettings({
        WORKER_QUEUE_MODE: "redis",
        REDIS_URL: "redis://localhost:6379/0"
      }),
      publisher
    );

    await expect(
      service.enqueue({
        name: "automatic_outreach_send",
        payload: { campaign_id: "campaign-1" },
        llmMode: "fake"
      })
    ).rejects.toThrow("Worker job is prohibited: automatic_outreach_send");

    expect(publisher.published).toEqual([]);
    expect(logger.list()).toEqual([]);
  });
});
