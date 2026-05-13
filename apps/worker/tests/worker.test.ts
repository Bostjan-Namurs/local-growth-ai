import { describe, expect, it } from "vitest";
import { acceptLocalWorkerJob, workerHealth, workerStatus } from "../src/worker.js";

describe("worker scaffold", () => {
  it("reports deterministic local health without queue connections", () => {
    expect(workerHealth()).toMatchObject({
      status: "ok",
      queueIntegration: "deferred",
      llmMode: "fake",
      message: "LocalGrowth worker scaffold is ready. BullMQ/Redis processing is deferred from Sprint 1."
    });
    expect(workerHealth().allowedJobs).toEqual([
      "source_compliance_check",
      "business_profile_generate",
      "proposal_generate",
      "app_spec_generate",
      "preview_build_stub"
    ]);
  });

  it("keeps queue integration deferred", () => {
    expect(workerStatus()).toContain("deferred from Sprint 1");
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
      queueIntegration: "deferred",
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
      reason: "Worker jobs must use LLM_MODE=fake during Sprint 1"
    });
  });

  it("blocks prohibited or approval-gated jobs", () => {
    expect(
      acceptLocalWorkerJob({
        name: "automatic_outreach_send" as never,
        payload: { campaign_id: "campaign-1" }
      })
    ).toMatchObject({
      status: "rejected",
      reason: "Worker job is prohibited in Sprint 1: automatic_outreach_send"
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
