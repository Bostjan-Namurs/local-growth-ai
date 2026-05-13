import { describe, expect, it } from "vitest";
import { InMemoryAgentRunLogger } from "../src/agents/run-logger.js";
import { SourceComplianceAgent } from "../src/agents/source-compliance.js";

describe("SourceComplianceAgent", () => {
  it("allows manual imports for proposal use with audit logging", async () => {
    const logger = new InMemoryAgentRunLogger();
    const result = await new SourceComplianceAgent(logger).run({
      sourceType: "manual_import",
      rawDataCategories: ["business_name", "email"],
      intendedUse: "proposal"
    });

    expect(result.output.allowed).toBe(true);
    expect(result.output.riskLevel).toBe("low");
    expect(result.run.status).toBe("completed");
    expect(result.run.inputHash).toHaveLength(64);
    expect(result.run.outputHash).toHaveLength(64);
    expect(result.run.approvalStatus).toBe("approved");
    expect(logger.runs).toHaveLength(1);
  });

  it("rejects Google Places scraping paths", async () => {
    const result = await new SourceComplianceAgent().run({
      sourceType: "google_places",
      sourceUrl: "https://maps.google.com/",
      rawDataCategories: ["business_name", "address", "phone"],
      intendedUse: "lead_generation"
    });

    expect(result.output.allowed).toBe(false);
    expect(result.output.riskLevel).toBe("high");
    expect(result.output.disallowedUse).toContain("scraping");
    expect(result.output.notes).toContain("not allowed");
    expect(result.run.approvalStatus).toBe("pending");
  });

  it("does not allow automatic marketing sends", async () => {
    const result = await new SourceComplianceAgent().run({
      sourceType: "licensed_dataset",
      rawDataCategories: ["business_name", "email"],
      intendedUse: "marketing"
    });

    expect(result.output.allowed).toBe(false);
    expect(result.output.requiresOptOut).toBe(true);
    expect(result.output.disallowedUse).toContain("marketing_without_approval_or_opt_out_check");
    expect(result.output.approvalRequired).toBe(true);
  });

  it("requires attribution for OSM-derived records", async () => {
    const result = await new SourceComplianceAgent().run({
      sourceType: "osm_extract",
      rawDataCategories: ["business_name", "address"],
      intendedUse: "lead_generation"
    });

    expect(result.output.allowed).toBe(true);
    expect(result.output.requiresAttribution).toBe(true);
    expect(result.output.riskLevel).toBe("medium");
  });
});
