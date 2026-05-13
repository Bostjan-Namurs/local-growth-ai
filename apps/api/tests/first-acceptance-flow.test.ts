import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { approvalStore } from "../src/services/approvals.js";
import { businessStore } from "../src/services/businesses.js";
import { workflowStore } from "../src/services/workflow-records.js";

describe("Sprint 1 acceptance workflow", () => {
  beforeEach(() => {
    approvalStore.clear();
    businessStore.clear();
    workflowStore.clear();
  });

  it("keeps the lead-to-preview path deterministic, fake, and approval gated", async () => {
    const app = createApp();

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({
      status: "ok",
      llm_mode: "fake"
    });
    expect(typeof health.json().database_configured).toBe("boolean");

    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: {
        name: "Example Bike Rentals",
        category: "bike_rental",
        vertical: "bike_rental",
        websiteUrl: "https://example-bike-rentals.test"
      }
    });
    expect(business.statusCode).toBe(201);
    const businessId = business.json().id as string;

    const sourceRecord = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/source-records`,
      payload: {
        sourceType: "manual_import",
        sourceName: "Admin import",
        allowedUse: ["lead_generation", "proposal"],
        disallowedUse: ["automatic_marketing"]
      }
    });
    expect(sourceRecord.statusCode).toBe(201);

    const compliance = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/source-records/${sourceRecord.json().id}/compliance`,
      payload: {
        intendedUse: "lead_generation",
        rawDataCategories: ["business_name", "website_url"]
      }
    });
    expect(compliance.statusCode).toBe(200);
    expect(compliance.json().source_record).toMatchObject({
      complianceStatus: "approved",
      attributionRequired: false
    });
    expect(compliance.json().agent_run).toMatchObject({
      agentName: "SourceComplianceAgent",
      status: "completed",
      approvalStatus: "approved"
    });
    expect(compliance.json().agent_run.inputHash).toHaveLength(64);
    expect(compliance.json().agent_run.outputHash).toHaveLength(64);

    const websiteAudit = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/website-audits`,
      payload: {
        websiteUrl: "https://example-bike-rentals.test",
        websiteFound: true,
        hasHttps: true,
        hasMobileLayout: true,
        hasBooking: false,
        hasMenuOrServices: true,
        hasClearCta: false,
        seoScore: 58,
        performanceScore: 64,
        issues: ["booking flow missing"]
      }
    });
    expect(websiteAudit.statusCode).toBe(201);

    const profile = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/business-profiles`
    });
    expect(profile.statusCode).toBe(201);
    expect(profile.json().output).toMatchObject({
      vertical: "bike_rental",
      recommendedPackage: "bike_rental_booking_plus",
      approvalRequired: true
    });
    expect(profile.json().output.digitalGaps).toContain("no online booking detected");

    const proposal = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals`
    });
    expect(proposal.statusCode).toBe(201);
    expect(proposal.json().output).toMatchObject({
      approvalStatus: "pending",
      approvalRequired: true
    });
    expect(proposal.json().output.outreachDraft).toContain("Draft only");

    const blockedAppSpec = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals/${proposal.json().id}/app-spec`
    });
    expect(blockedAppSpec.statusCode).toBe(409);

    const approval = await app.inject({
      method: "POST",
      url: "/approvals",
      payload: {
        entityType: "proposal",
        entityId: proposal.json().id,
        decision: "approved",
        approvedBy: "admin"
      }
    });
    expect(approval.statusCode).toBe(201);

    const generatedApp = await app.inject({
      method: "POST",
      url: `/businesses/${businessId}/proposals/${proposal.json().id}/app-spec`
    });
    expect(generatedApp.statusCode).toBe(201);
    expect(generatedApp.json()).toMatchObject({
      deploymentStatus: "draft",
      approvalStatus: "pending"
    });
    expect(generatedApp.json().appSpec).toMatchObject({
      templateId: "rental-booking-pwa",
      deploymentTarget: "preview",
      approvalRequired: true
    });

    const previewBuild = await app.inject({
      method: "POST",
      url: `/generated-apps/${generatedApp.json().id}/preview-builds`
    });
    expect(previewBuild.statusCode).toBe(201);
    expect(previewBuild.json()).toMatchObject({
      generatedAppId: generatedApp.json().id,
      buildType: "preview",
      status: "queued"
    });
  });
});
