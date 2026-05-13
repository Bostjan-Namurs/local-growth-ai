import { describe, expect, it } from "vitest";
import { ProposalAgent } from "../src/agents/proposal.js";

describe("ProposalAgent", () => {
  it("creates an approval-required proposal draft", async () => {
    const result = await new ProposalAgent().run({
      businessName: "Example Bike Rentals",
      vertical: "bike_rental",
      recommendedPackage: "bike_rental_booking_plus",
      digitalGaps: ["no online booking detected"],
      missingData: ["pricing_rules"]
    });

    expect(result.output.title).toBe("Example Bike Rentals proposal draft");
    expect(result.output.vertical).toBe("bike_rental");
    expect(result.output.recommendedPackage).toBe("bike_rental_booking_plus");
    expect(result.output.proposalText).toContain("bike_rental_booking_plus");
    expect(result.output.approvalStatus).toBe("pending");
    expect(result.output.approvalRequired).toBe(true);
    expect(result.output.outreachDraft).toContain("Draft only");
    expect(result.output.complianceNotes.join(" ")).toContain("suppression");
    expect(result.run.modelAlias).toBe("proposal_writer");
    expect(result.run.approvalStatus).toBe("pending");
  });

  it("does not invent pricing or guarantees", async () => {
    const result = await new ProposalAgent().run({
      businessName: "Unknown Salon"
    });

    expect(result.output.proposalText).toContain("must be confirmed by a human");
    expect(result.output.proposalText).not.toContain("EUR");
    expect(result.output.proposalText).not.toContain("guaranteed");
  });
});
