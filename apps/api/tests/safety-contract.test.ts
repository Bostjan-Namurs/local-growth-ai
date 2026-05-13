import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("Sprint 1 safety contract", () => {
  it("does not expose public LLM routes", async () => {
    const app = createApp();
    try {
      for (const url of ["/llm", "/v1/chat/completions", "/chat/completions", "/embeddings"]) {
        const response = await app.inject({
          method: "POST",
          url,
          payload: { prompt: "hello" }
        });

        expect(response.statusCode).toBe(404);
      }
    } finally {
      await app.close();
    }
  });

  it("does not expose automatic outreach routes", async () => {
    const app = createApp();
    try {
      for (const url of ["/outreach/send", "/campaigns/send", "/campaigns/auto-send"]) {
        const response = await app.inject({
          method: "POST",
          url,
          payload: { campaign_id: "campaign-1" }
        });

        expect(response.statusCode).toBe(404);
      }
    } finally {
      await app.close();
    }
  });

  it("does not expose production deployment routes", async () => {
    const app = createApp();
    try {
      for (const url of [
        "/deployments/production",
        "/generated-apps/app-1/production-deploy",
        "/generated-apps/app-1/deploy"
      ]) {
        const response = await app.inject({
          method: "POST",
          url,
          payload: { generated_app_id: "app-1" }
        });

        expect(response.statusCode).toBe(404);
      }
    } finally {
      await app.close();
    }
  });
});
