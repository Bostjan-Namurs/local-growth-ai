import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { businessStore } from "../src/services/businesses.js";
import { workflowStore } from "../src/services/workflow-records.js";

describe("local workflow records", () => {
  beforeEach(() => {
    businessStore.clear();
    workflowStore.clear();
  });

  it("generates profile and proposal records for a business", async () => {
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
      url: `/businesses/${business.json().id}/source-records`,
      payload: {
        sourceType: "manual_import",
        allowedUse: ["proposal"]
      }
    });
    await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/website-audits`,
      payload: {
        websiteFound: true,
        hasBooking: false,
        hasClearCta: false,
        issues: ["pricing unclear"]
      }
    });

    const profile = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/business-profiles`
    });
    const proposal = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/proposals`
    });

    expect(profile.statusCode).toBe(201);
    expect(profile.json().output.recommendedPackage).toBe("bike_rental_booking_plus");
    expect(profile.json().approvalStatus).toBe("pending");
    expect(proposal.statusCode).toBe(201);
    expect(proposal.json().businessProfileId).toBe(profile.json().id);
    expect(proposal.json().output.approvalRequired).toBe(true);
    expect(proposal.json().output.outreachDraft).toContain("Draft only");
  });

  it("does not create proposals before a profile exists", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: { name: "No Profile Yet" }
    });

    const proposal = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/proposals`
    });

    expect(proposal.statusCode).toBe(404);
    expect(proposal.json().detail).toContain("No business profile exists");
  });

  it("excludes restricted source records from profile inputs", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: {
        name: "Restricted Source Target",
        vertical: "bike_rental"
      }
    });
    const sourceRecord = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records`,
      payload: {
        sourceType: "google_places"
      }
    });
    await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records/${sourceRecord.json().id}/compliance`,
      payload: {
        intendedUse: "lead_generation",
        rawDataCategories: ["business_name"]
      }
    });

    const profile = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/business-profiles`
    });

    expect(profile.statusCode).toBe(201);
    expect(profile.json().output.missingData).toContain("source_records");
  });
});
