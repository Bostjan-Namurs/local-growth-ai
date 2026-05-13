import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { businessStore } from "../src/services/businesses.js";

describe("business API", () => {
  beforeEach(() => {
    businessStore.clear();
  });

  it("creates and lists manual business leads", async () => {
    const app = createApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: {
        name: "Example Bike Rentals",
        vertical: "bike_rental",
        email: "hello@example.com",
        websiteUrl: "https://example.com"
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      name: "Example Bike Rentals",
      normalizedName: "example bike rentals",
      complianceStatus: "unknown"
    });

    const listResponse = await app.inject({ method: "GET", url: "/businesses" });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().businesses).toHaveLength(1);
  });

  it("attaches source records to a business", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: { name: "Manual Lead" }
    });

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records`,
      payload: {
        sourceType: "manual_import",
        allowedUse: ["proposal"],
        licenseName: "customer provided"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      businessId: business.json().id,
      sourceType: "manual_import",
      allowedUse: ["proposal"]
    });
  });

  it("records website audits from manual or deterministic inputs", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: { name: "Audit Target", websiteUrl: "https://example.com" }
    });

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/website-audits`,
      payload: {
        websiteUrl: "https://example.com",
        websiteFound: true,
        hasHttps: true,
        hasBooking: false,
        issues: ["no online booking detected"]
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      businessId: business.json().id,
      websiteFound: true,
      hasBooking: false
    });
  });

  it("runs source compliance for attached source records", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: { name: "Compliance Target" }
    });
    const sourceRecord = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records`,
      payload: {
        sourceType: "google_places"
      }
    });

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records/${sourceRecord.json().id}/compliance`,
      payload: {
        intendedUse: "lead_generation",
        rawDataCategories: ["business_name", "address"]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().compliance.allowed).toBe(false);
    expect(response.json().source_record.complianceStatus).toBe("restricted");
    expect(response.json().source_record.retentionUntil).toBeNull();
    expect(response.json().source_record.disallowedUse).toContain("scraping");
    expect(response.json().agent_run.agentName).toBe("SourceComplianceAgent");
  });

  it("keeps marketing use restricted at the API boundary", async () => {
    const app = createApp();
    const business = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: { name: "Marketing Guard Target" }
    });
    const sourceRecord = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records`,
      payload: {
        sourceType: "licensed_dataset",
        allowedUse: ["lead_generation", "proposal"]
      }
    });

    const response = await app.inject({
      method: "POST",
      url: `/businesses/${business.json().id}/source-records/${sourceRecord.json().id}/compliance`,
      payload: {
        intendedUse: "marketing",
        rawDataCategories: ["business_name", "email"]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().compliance).toMatchObject({
      allowed: false,
      requiresOptOut: true,
      approvalRequired: true
    });
    expect(response.json().source_record).toMatchObject({
      complianceStatus: "restricted",
      allowedUse: ["lead_generation", "proposal", "customer_app"]
    });
    expect(response.json().source_record.retentionUntil).toEqual(expect.any(String));
    expect(response.json().source_record.disallowedUse).toContain(
      "marketing_without_approval_or_opt_out_check"
    );
    expect(response.json().agent_run.approvalStatus).toBe("pending");
  });

  it("rejects invalid business payloads", async () => {
    const app = createApp();
    const response = await app.inject({
      method: "POST",
      url: "/businesses",
      payload: {
        name: "",
        email: "not-an-email"
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
