import { z } from "zod";
import { getSettings, type Settings } from "../config.js";
import { LlmClient } from "../llm/client.js";
import { stableHash } from "./hash.js";
import { type AgentRun, type AgentRunLogger, InMemoryAgentRunLogger } from "./run-logger.js";

export const businessProfileInputSchema = z.object({
  business: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    category: z.string().optional(),
    vertical: z.string().optional(),
    websiteUrl: z.string().url().optional()
  }),
  websiteAudit: z
    .object({
      websiteFound: z.boolean().optional(),
      hasHttps: z.boolean().optional(),
      hasMobileLayout: z.boolean().optional(),
      hasBooking: z.boolean().optional(),
      hasMenuOrServices: z.boolean().optional(),
      hasClearCta: z.boolean().optional(),
      seoScore: z.number().int().min(0).max(100).optional(),
      performanceScore: z.number().int().min(0).max(100).optional(),
      issues: z.array(z.string()).default([])
    })
    .optional(),
  sourceRecordIds: z.array(z.string()).default([])
});

export type BusinessProfileInput = z.input<typeof businessProfileInputSchema>;
type ParsedBusinessProfileInput = z.infer<typeof businessProfileInputSchema>;

export const businessProfileOutputSchema = z.object({
  businessSummary: z.string(),
  vertical: z.string(),
  digitalGaps: z.array(z.string()),
  likelyCustomerSegments: z.array(z.string()),
  recommendedPackage: z.string(),
  missingData: z.array(z.string()),
  claims: z.array(
    z.object({
      claim: z.string(),
      source: z.string(),
      confidence: z.number().min(0).max(1)
    })
  ),
  confidence: z.number().min(0).max(1),
  approvalRequired: z.literal(true)
});

export type BusinessProfileOutput = z.infer<typeof businessProfileOutputSchema>;

export interface BusinessProfileResult {
  run: AgentRun;
  output: BusinessProfileOutput;
}

export class BusinessProfileAgent {
  readonly name = "BusinessProfileAgent";
  private readonly llmClient: LlmClient;

  constructor(
    private readonly logger: AgentRunLogger = new InMemoryAgentRunLogger(),
    settings: Settings = getSettings({})
  ) {
    this.llmClient = new LlmClient(settings);
  }

  async run(input: BusinessProfileInput): Promise<BusinessProfileResult> {
    const parsed = businessProfileInputSchema.parse(input);
    const run = await this.logger.start({
      agentName: this.name,
      inputHash: stableHash(parsed),
      modelAlias: "profiler",
      approvalStatus: "pending",
      metadata: {
        business_name: parsed.business.name,
        vertical: parsed.business.vertical ?? "unknown"
      }
    });

    this.llmClient.complete({
      modelAlias: "profiler",
      task: "business_profile",
      input: parsed,
      promptVersion: "business-profile-fake-v1"
    });

    const output = businessProfileOutputSchema.parse(this.buildProfile(parsed));
    const finishedRun = await this.logger.finish({
      runId: run.id,
      outputHash: stableHash(output),
      approvalStatus: "pending",
      metadata: {
        confidence: output.confidence,
        missing_data_count: output.missingData.length
      }
    });

    return { run: finishedRun, output };
  }

  private buildProfile(input: ParsedBusinessProfileInput): BusinessProfileOutput {
    const vertical = input.business.vertical ?? input.business.category ?? "unknown";
    const missingData = this.missingData(input);
    const digitalGaps = this.digitalGaps(input);
    const claims = this.claims(input);

    return {
      businessSummary: `${input.business.name} is a ${vertical} business. Unconfirmed details remain placeholders until reviewed.`,
      vertical,
      digitalGaps,
      likelyCustomerSegments: ["local customers"],
      recommendedPackage: vertical === "bike_rental" ? "bike_rental_booking_plus" : "placeholder_package",
      missingData,
      claims,
      confidence: claims.length > 0 ? 0.72 : 0.45,
      approvalRequired: true
    };
  }

  private missingData(input: ParsedBusinessProfileInput): string[] {
    const missing = [];
    if (!input.business.websiteUrl) missing.push("website_url");
    if (!input.business.vertical) missing.push("confirmed_vertical");
    if (!input.websiteAudit) missing.push("website_audit");
    if (input.sourceRecordIds.length === 0) missing.push("source_records");
    return missing;
  }

  private digitalGaps(input: ParsedBusinessProfileInput): string[] {
    const audit = input.websiteAudit;
    if (!audit) return ["website audit required"];

    const gaps = [...audit.issues];
    if (audit.websiteFound === false) gaps.push("website not found");
    if (audit.hasBooking === false) gaps.push("no online booking detected");
    if (audit.hasClearCta === false) gaps.push("weak or missing call to action");
    return [...new Set(gaps)];
  }

  private claims(input: ParsedBusinessProfileInput): BusinessProfileOutput["claims"] {
    const audit = input.websiteAudit;
    if (!audit) return [];

    const claims: BusinessProfileOutput["claims"] = [];
    if (audit.hasBooking === false) {
      claims.push({
        claim: "Website audit did not detect an online booking flow.",
        source: "website_audit",
        confidence: 0.82
      });
    }
    if (audit.hasClearCta === false) {
      claims.push({
        claim: "Website audit did not detect a clear call to action.",
        source: "website_audit",
        confidence: 0.76
      });
    }
    return claims;
  }
}
