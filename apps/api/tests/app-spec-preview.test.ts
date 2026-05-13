import { beforeEach, describe, expect, it } from "vitest";
import { AppSpecAgent } from "../src/agents/app-spec.js";
import { createApp } from "../src/app.js";
import { approvalStore } from "../src/services/approvals.js";
import { businessStore } from "../src/services/businesses.js";
import { workflowStore } from "../src/services/workflow-records.js";

describe("app spec and preview build stubs", () => {
  beforeEach(() => {
    approvalStore.clear();
    businessStore.clear();
    workflowStore.clear();
  });

  async function createProposal() {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: {
        name: "Example Bike Rentals",
        vertical: "bike_rental",
        websiteUrl: "https://example.com"
      }
    });
    await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/business-profiles`
    });
    const proposal = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/proposals`
    });
    return { app, businessId: business.json().id as string, proposalId: proposal.json().id as string };
  }

  it("requires proposal approval before app spec generation", async () => {
    const { app, businessId, proposalId } = await createProposal();

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals/${proposalId}/app-spec`
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().detail).toContain("must be approved");
  });

  it("logs app spec generation under the template-config coder alias", async () => {
    const result = await new AppSpecAgent().run({
      businessName: "Example Bike Rentals",
      vertical: "bike_rental",
      recommendedPackage: "bike_rental_booking_plus",
      proposalId: "proposal-1"
    });

    expect(result.run.modelAlias).toBe("coder");
    expect(result.output.templateId).toBe("rental-booking-pwa");
    expect(result.output.deploymentTarget).toBe("preview");
  });

  it("creates app specs and preview build records without deploying", async () => {
    const { app, businessId, proposalId } = await createProposal();
    approvalStore.create({
      entityType: "proposal",
      entityId: proposalId,
      decision: "approved"
    });

    const generatedApp = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals/${proposalId}/app-spec`
    });
    const previewBuild = await app.inject({
      method: "POST",
      url: `/generated-apps/${generatedApp.json().id}/preview-builds`
    });

    expect(generatedApp.statusCode).toBe(201);
    expect(generatedApp.json().appSpec.deploymentTarget).toBe("preview");
    expect(generatedApp.json().deploymentStatus).toBe("draft");
    expect(generatedApp.json().approvalStatus).toBe("pending");
    expect(previewBuild.statusCode).toBe(201);
    expect(previewBuild.json()).toMatchObject({
      generatedAppId: generatedApp.json().id,
      buildType: "preview",
      status: "queued"
    });
  });

  it("blocks app spec generation when a later approval decision is not approved", async () => {
    const { app, businessId, proposalId } = await createProposal();
    approvalStore.create({
      entityType: "proposal",
      entityId: proposalId,
      decision: "approved"
    });
    approvalStore.create({
      entityType: "proposal",
      entityId: proposalId,
      decision: "needs_changes"
    });

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals/${proposalId}/app-spec`
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().detail).toContain("must be approved");
  });
});
