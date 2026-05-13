import { describe, expect, it } from "vitest";
import { BusinessProfileAgent } from "../src/agents/business-profile.js";
import { InMemoryAgentRunLogger } from "../src/agents/run-logger.js";

describe("BusinessProfileAgent", () => {
  it("builds a profile from known audit facts", async () => {
    const logger = new InMemoryAgentRunLogger();
    const result = await new BusinessProfileAgent(logger).run({
      business: {
        id: "business-1",
        name: "Example Bike Rentals",
        vertical: "bike_rental",
        websiteUrl: "https://example.com"
      },
      websiteAudit: {
        websiteFound: true,
        hasHttps: true,
        hasMobileLayout: true,
        hasBooking: false,
        hasClearCta: false,
        issues: ["pricing unclear"]
      },
      sourceRecordIds: ["source-1"]
    });

    expect(result.output.vertical).toBe("bike_rental");
    expect(result.output.recommendedPackage).toBe("bike_rental_booking_plus");
    expect(result.output.digitalGaps).toContain("no online booking detected");
    expect(result.output.claims).toContainEqual({
      claim: "Website audit did not detect an online booking flow.",
      source: "website_audit",
      confidence: 0.82
    });
    expect(result.output.approvalRequired).toBe(true);
    expect(result.run.modelAlias).toBe("profiler");
    expect(result.run.outputHash).toHaveLength(64);
    expect(logger.runs[0].approvalStatus).toBe("pending");
  });

  it("uses placeholders for unknown facts instead of inventing them", async () => {
    const result = await new BusinessProfileAgent().run({
      business: {
        name: "Unknown Cafe"
      }
    });

    expect(result.output.vertical).toBe("unknown");
    expect(result.output.recommendedPackage).toBe("placeholder_package");
    expect(result.output.missingData).toEqual([
      "website_url",
      "confirmed_vertical",
      "website_audit",
      "source_records"
    ]);
    expect(result.output.claims).toEqual([]);
    expect(result.output.businessSummary).toContain("Unconfirmed details remain placeholders");
  });
});
