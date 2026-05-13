import { describe, expect, it, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { approvalStore } from "../src/services/approvals.js";

describe("approval API", () => {
  beforeEach(() => {
    approvalStore.clear();
  });

  it("creates explicit approval records without performing actions", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/approvals",
      payload: {
        entityType: "proposal",
        entityId: "00000000-0000-0000-0000-000000000001",
        decision: "approved",
        notes: "Reviewed by admin"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      entityType: "proposal",
      entityId: "00000000-0000-0000-0000-000000000001",
      decision: "approved",
      notes: "Reviewed by admin"
    });
  });

  it("lists approval records", async () => {
    const app = createApp();
    approvalStore.create({
      entityType: "business_profile",
      entityId: "profile-1",
      decision: "pending"
    });

    const response = await app.inject({ method: "GET", url: "/approvals" });

    expect(response.statusCode).toBe(200);
    expect(response.json().approvals).toHaveLength(1);
  });

  it("uses the latest decision as the current approval state", () => {
    approvalStore.create({
      entityType: "proposal",
      entityId: "proposal-1",
      decision: "approved"
    });
    approvalStore.create({
      entityType: "proposal",
      entityId: "proposal-1",
      decision: "needs_changes"
    });

    expect(approvalStore.latestFor("proposal", "proposal-1")?.decision).toBe("needs_changes");
    expect(approvalStore.hasApproved("proposal", "proposal-1")).toBe(false);

    approvalStore.create({
      entityType: "proposal",
      entityId: "proposal-1",
      decision: "approved"
    });

    expect(approvalStore.hasApproved("proposal", "proposal-1")).toBe(true);
  });

  it("rejects invalid approval payloads", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/approvals",
      payload: {
        entityType: "proposal",
        entityId: "proposal-1",
        decision: "auto_send"
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
