import { z } from "zod";
import { stableHash } from "./hash.js";
import { type AgentRun, type AgentRunLogger, InMemoryAgentRunLogger } from "./run-logger.js";

export const sourceComplianceInputSchema = z.object({
  sourceType: z.enum([
    "manual_import",
    "licensed_dataset",
    "osm_extract",
    "google_places",
    "website",
    "customer_submitted",
    "unknown"
  ]),
  sourceUrl: z.string().url().optional(),
  rawDataCategories: z.array(z.string()).default([]),
  intendedUse: z.enum(["lead_generation", "proposal", "customer_app", "marketing"])
});

export type SourceComplianceInput = z.infer<typeof sourceComplianceInputSchema>;

export const sourceComplianceOutputSchema = z.object({
  allowed: z.boolean(),
  allowedUse: z.array(z.string()),
  disallowedUse: z.array(z.string()),
  requiresAttribution: z.boolean(),
  requiresOptOut: z.boolean(),
  retentionDays: z.number().int().positive().nullable(),
  riskLevel: z.enum(["low", "medium", "high"]),
  notes: z.string(),
  approvalRequired: z.boolean()
});

export type SourceComplianceOutput = z.infer<typeof sourceComplianceOutputSchema>;

export interface SourceComplianceResult {
  run: AgentRun;
  output: SourceComplianceOutput;
}

export class SourceComplianceAgent {
  readonly name = "SourceComplianceAgent";

  constructor(private readonly logger: AgentRunLogger = new InMemoryAgentRunLogger()) {}

  async run(input: SourceComplianceInput): Promise<SourceComplianceResult> {
    const parsed = sourceComplianceInputSchema.parse(input);
    const run = await this.logger.start({
      agentName: this.name,
      inputHash: stableHash(parsed),
      modelAlias: "classifier",
      approvalStatus: "pending",
      metadata: {
        source_type: parsed.sourceType,
        intended_use: parsed.intendedUse
      }
    });

    const output = sourceComplianceOutputSchema.parse(this.evaluate(parsed));
    const finishedRun = await this.logger.finish({
      runId: run.id,
      outputHash: stableHash(output),
      approvalStatus: output.approvalRequired ? "pending" : "approved",
      metadata: {
        risk_level: output.riskLevel,
        allowed: output.allowed
      }
    });

    return { run: finishedRun, output };
  }

  private evaluate(input: SourceComplianceInput): SourceComplianceOutput {
    if (input.sourceType === "google_places") {
      return {
        allowed: false,
        allowedUse: [],
        disallowedUse: [input.intendedUse, "bulk_lead_generation", "scraping"],
        requiresAttribution: false,
        requiresOptOut: true,
        retentionDays: null,
        riskLevel: "high",
        notes: "Google Maps/Places scraping is not allowed. Use licensed APIs or manual/customer-submitted sources instead.",
        approvalRequired: true
      };
    }

    if (input.sourceType === "unknown") {
      return {
        allowed: false,
        allowedUse: [],
        disallowedUse: [input.intendedUse],
        requiresAttribution: false,
        requiresOptOut: input.intendedUse === "marketing",
        retentionDays: null,
        riskLevel: "high",
        notes: "Unknown source terms require admin review before use.",
        approvalRequired: true
      };
    }

    if (input.intendedUse === "marketing") {
      return {
        allowed: false,
        allowedUse: ["lead_generation", "proposal", "customer_app"],
        disallowedUse: ["marketing_without_approval_or_opt_out_check"],
        requiresAttribution: input.sourceType === "osm_extract",
        requiresOptOut: true,
        retentionDays: 365,
        riskLevel: "medium",
        notes: "Marketing send is not allowed automatically. Store as a draft and check suppression/opt-out before approval.",
        approvalRequired: true
      };
    }

    if (input.sourceType === "osm_extract") {
      return {
        allowed: true,
        allowedUse: [input.intendedUse],
        disallowedUse: ["bulk_marketing_without_basis"],
        requiresAttribution: true,
        requiresOptOut: true,
        retentionDays: 365,
        riskLevel: "medium",
        notes: "OSM-derived records require attribution and source metadata.",
        approvalRequired: false
      };
    }

    return {
      allowed: true,
      allowedUse: [input.intendedUse],
      disallowedUse: ["automatic_outreach_without_approval"],
      requiresAttribution: false,
      requiresOptOut: true,
      retentionDays: 365,
      riskLevel: "low",
      notes: "Source can be used for the requested non-automated workflow with stored metadata.",
      approvalRequired: false
    };
  }
}
