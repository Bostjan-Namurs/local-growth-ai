import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("agent run API", () => {
  it("exposes read-only audit records", async () => {
    const app = createApp();
    try {
      const businessResponse = await app.inject({
        method: "POST",
        url: "/businesses",
        payload: {
          name: "Audit Route Bike Rental",
          vertical: "bike_rental"
        }
      });
      const business = businessResponse.json<{ id: string }>();

      const sourceResponse = await app.inject({
        method: "POST",
        url: `/businesses/${business.id}/source-records`,
        payload: {
          sourceType: "manual_import",
          allowedUse: ["proposal"]
        }
      });
      const source = sourceResponse.json<{ id: string }>();

      const complianceResponse = await app.inject({
        method: "POST",
        url: `/businesses/${business.id}/source-records/${source.id}/compliance`,
        payload: {
          intendedUse: "proposal",
          rawDataCategories: ["business_name"]
        }
      });
      expect(complianceResponse.statusCode).toBe(200);

      const compliance = complianceResponse.json<{ agent_run: { id: string } }>();
      const listResponse = await app.inject({ method: "GET", url: "/agent-runs" });
      expect(listResponse.statusCode).toBe(200);
      expect(
        listResponse
          .json<{ agent_runs: Array<{ id: string; metadata: Record<string, unknown> }> }>()
          .agent_runs.some(
            (run) => run.id === compliance.agent_run.id && run.metadata.source_type === "manual_import"
          )
      ).toBe(true);

      const getResponse = await app.inject({
        method: "GET",
        url: `/agent-runs/${compliance.agent_run.id}`
      });
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json<{ metadata: Record<string, unknown> }>().metadata).toMatchObject({
        source_type: "manual_import",
        intended_use: "proposal",
        risk_level: "low",
        allowed: true
      });
    } finally {
      await app.close();
    }
  });
});
