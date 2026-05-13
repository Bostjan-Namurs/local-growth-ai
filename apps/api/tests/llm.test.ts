import { describe, expect, it } from "vitest";
import { getSettings } from "../src/config.js";
import { LlmClient, llmRequestSchema } from "../src/llm/client.js";

describe("fake LLM client", () => {
  it("detects bike rental through classifier alias", () => {
    const client = new LlmClient(getSettings({}));
    const response = client.complete({
      modelAlias: "classifier",
      task: "classify",
      input: { text: "e-bike rental shop" },
      promptVersion: "fake-v1"
    });

    expect(response.fake).toBe(true);
    expect(response.content.vertical_id).toBe("bike_rental");
    expect(response.content.confidence).toBe(0.91);
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });

  it("returns deterministic proposal writer output", () => {
    const client = new LlmClient(getSettings({}));
    const response = client.complete({
      modelAlias: "proposal_writer",
      task: "proposal",
      input: { business_name: "Example Bikes" },
      promptVersion: "fake-v1"
    });

    expect(response.content.title).toBe("Fake proposal draft");
    expect(response.content.sections).toContain("required_customer_inputs");
    expect(response.content.approval_required).toBe(true);
  });

  it("supports the generic Sprint 1 writer alias", () => {
    const client = new LlmClient(getSettings({}));
    const response = client.complete({
      modelAlias: "writer",
      task: "proposal",
      input: { business_name: "Example Bikes" },
      promptVersion: "fake-v1"
    });

    expect(response.modelAlias).toBe("writer");
    expect(response.content.title).toBe("Fake proposal draft");
    expect(response.content.approval_required).toBe(true);
  });

  it("returns passing judge output", () => {
    const client = new LlmClient(getSettings({}));
    const response = client.complete({
      modelAlias: "judge",
      task: "qa",
      input: {},
      promptVersion: "fake-v1"
    });

    expect(response.content.passed).toBe(true);
    expect(response.content.issues).toEqual([]);
  });

  it("rejects raw model names", () => {
    expect(() =>
      llmRequestSchema.parse({
        modelAlias: "mistral-large-latest",
        task: "classify",
        input: {}
      })
    ).toThrow();
  });

  it("keeps gateway calls deferred", () => {
    const client = new LlmClient(getSettings({ LLM_MODE: "gateway" }));

    expect(() =>
      client.complete({
        modelAlias: "judge",
        task: "qa",
        input: {},
        promptVersion: "fake-v1"
      })
    ).toThrow("deferred from Sprint 1");
  });
});
