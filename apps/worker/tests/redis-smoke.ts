import { afterAll, describe, expect, it } from "vitest";
import { createWorkerQueue } from "../src/queue.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379/0";
const queueName = process.env.WORKER_QUEUE_NAME ?? "localgrowth.worker.smoke";
const queue = await createWorkerQueue({
  mode: "redis",
  queueName,
  redisUrl
});

afterAll(async () => {
  await queue.close();
});

describe("worker Redis queue smoke", () => {
  it("enqueues a validated fake-mode job through BullMQ", async () => {
    await expect(
      queue.enqueue({
        name: "source_compliance_check",
        llmMode: "fake",
        payload: { source_record_id: "source-smoke-1" }
      })
    ).resolves.toMatchObject({
      status: "accepted",
      jobName: "source_compliance_check",
      queueIntegration: "redis",
      llmMode: "fake"
    });
  });
});
