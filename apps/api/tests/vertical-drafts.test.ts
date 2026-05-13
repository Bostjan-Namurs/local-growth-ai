import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { verticalDraftStore } from "../src/services/vertical-drafts.js";

describe("vertical draft API", () => {
  beforeEach(() => {
    verticalDraftStore.clear();
  });

  it("creates draft-only vertical requests", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/vertical-drafts",
      payload: {
        verticalId: "kayak_rental",
        name: "Kayak Rental",
        appPattern: "rental_booking",
        templateId: "rental-booking-pwa",
        wizardPayload: {
          notes: "Draft only"
        },
        riskFlags: ["requires_human_review"]
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      verticalId: "kayak_rental",
      status: "draft",
      appPattern: "rental_booking"
    });
    expect(response.json().riskFlags).toContain("requires_human_review");
  });

  it("lists draft requests without activating verticals", async () => {
    const app = createApp();
    verticalDraftStore.create({
      verticalId: "ski_rental",
      name: "Ski Rental",
      appPattern: "rental_booking",
      templateId: "rental-booking-pwa"
    });

    const response = await app.inject({ method: "GET", url: "/vertical-drafts" });

    expect(response.statusCode).toBe(200);
    expect(response.json().vertical_drafts).toHaveLength(1);
    expect(response.json().vertical_drafts[0].status).toBe("draft");
    expect(response.json().vertical_drafts[0].riskFlags).toContain("requires_human_review");
  });

  it("rejects invalid vertical ids", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/vertical-drafts",
      payload: {
        verticalId: "Bad Vertical",
        name: "Bad Vertical",
        appPattern: "rental_booking",
        templateId: "rental-booking-pwa"
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
