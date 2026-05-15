import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { getSettings } from "../src/config.js";

const internalToken = "test-internal-token";

function createInternalApp() {
  return createApp(
    getSettings({
      INTERNAL_API_TOKEN: internalToken,
      LLM_MODE: "fake",
      WORKER_QUEUE_MODE: "local",
      WORKER_QUEUE_NAME: "localgrowth.test"
    })
  );
}

describe("internal worker job enqueue API", () => {
  it("hides the internal worker enqueue route without the internal token", async () => {
    const app = createInternalApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/internal/worker-jobs",
        payload: {
          name: "proposal_generate",
          payload: { business_id: "business-1" }
        }
      });

      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("queues allowed fake-mode worker jobs and writes agent-run audit metadata", async () => {
    const app = createInternalApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/internal/worker-jobs",
        headers: { "x-internal-api-token": internalToken },
        payload: {
          name: "proposal_generate",
          llmMode: "fake",
          payload: { business_id: "business-1" }
        }
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().worker_job).toMatchObject({
        status: "queued",
        jobName: "proposal_generate",
        queueIntegration: "local",
        queueName: "localgrowth.test",
        llmMode: "fake",
        modelAlias: "proposal_writer",
        approvalStatus: "not_required"
      });
      expect(response.json().worker_job.inputHash).toHaveLength(64);
      expect(response.json().agent_run).toMatchObject({
        id: response.json().worker_job.agentRunId,
        agentName: "Worker:proposal_generate",
        status: "queued",
        modelAlias: "proposal_writer",
        approvalStatus: "not_required",
        metadata: {
          workflow: "worker_enqueue",
          job_name: "proposal_generate",
          queue_integration: "local",
          queue_name: "localgrowth.test",
          llm_mode: "fake",
          payload: { business_id: "business-1" }
        }
      });

      const runs = await app.inject({ method: "GET", url: "/agent-runs" });
      expect(runs.json().agent_runs[0]).toMatchObject({
        id: response.json().worker_job.agentRunId,
        status: "queued",
        agentName: "Worker:proposal_generate"
      });
    } finally {
      await app.close();
    }
  });

  it("rejects prohibited worker jobs before audit records are created", async () => {
    const app = createInternalApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/internal/worker-jobs",
        headers: { "x-internal-api-token": internalToken },
        payload: {
          name: "automatic_outreach_send",
          payload: { campaign_id: "campaign-1" }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().detail).toBe("Worker job is prohibited: automatic_outreach_send");

      const runs = await app.inject({ method: "GET", url: "/agent-runs" });
      expect(runs.json().agent_runs).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("keeps app spec enqueue approval-gated", async () => {
    const app = createInternalApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/internal/worker-jobs",
        headers: { "x-internal-api-token": internalToken },
        payload: {
          name: "app_spec_generate",
          payload: { proposal_id: "proposal-1" }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().detail).toBe("App spec generation requires stored approval before enqueue");
    } finally {
      await app.close();
    }
  });
});
