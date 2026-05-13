import { z } from "zod";
import { getSettings, type Settings } from "../config.js";
import { LlmClient } from "../llm/client.js";
import { stableHash } from "./hash.js";
import { type AgentRun, type AgentRunLogger, InMemoryAgentRunLogger } from "./run-logger.js";

export const proposalInputSchema = z.object({
  businessName: z.string().min(1),
  vertical: z.string().default("unknown"),
  recommendedPackage: z.string().default("placeholder_package"),
  digitalGaps: z.array(z.string()).default([]),
  missingData: z.array(z.string()).default([]),
  claims: z
    .array(
      z.object({
        claim: z.string(),
        source: z.string(),
        confidence: z.number().min(0).max(1)
      })
    )
    .default([])
});

export type ProposalInput = z.input<typeof proposalInputSchema>;
type ParsedProposalInput = z.infer<typeof proposalInputSchema>;

export const proposalOutputSchema = z.object({
  title: z.string(),
  vertical: z.string(),
  recommendedPackage: z.string(),
  proposalText: z.string(),
  sections: z.array(z.string()),
  outreachDraft: z.string(),
  missingData: z.array(z.string()),
  approvalStatus: z.literal("pending"),
  approvalRequired: z.literal(true),
  complianceNotes: z.array(z.string())
});

export type ProposalOutput = z.infer<typeof proposalOutputSchema>;

export interface ProposalResult {
  run: AgentRun;
  output: ProposalOutput;
}

export class ProposalAgent {
  readonly name = "ProposalAgent";
  private readonly llmClient: LlmClient;

  constructor(
    private readonly logger: AgentRunLogger = new InMemoryAgentRunLogger(),
    settings: Settings = getSettings({})
  ) {
    this.llmClient = new LlmClient(settings);
  }

  async run(input: ProposalInput): Promise<ProposalResult> {
    const parsed = proposalInputSchema.parse(input);
    const run = await this.logger.start({
      agentName: this.name,
      inputHash: stableHash(parsed),
      modelAlias: "proposal_writer",
      approvalStatus: "pending",
      metadata: {
        business_name: parsed.businessName,
        vertical: parsed.vertical
      }
    });

    this.llmClient.complete({
      modelAlias: "proposal_writer",
      task: "proposal",
      input: parsed,
      promptVersion: "proposal-fake-v1"
    });

    const output = proposalOutputSchema.parse(this.buildProposal(parsed));
    const finishedRun = await this.logger.finish({
      runId: run.id,
      outputHash: stableHash(output),
      approvalStatus: "pending",
      metadata: {
        approval_required: true,
        missing_data_count: output.missingData.length
      }
    });

    return { run: finishedRun, output };
  }

  private buildProposal(input: ParsedProposalInput): ProposalOutput {
    const sections = [
      "business_summary",
      "observed_gaps",
      "recommended_package",
      "implementation_plan",
      "required_customer_inputs"
    ];

    return {
      title: `${input.businessName} proposal draft`,
      vertical: input.vertical,
      recommendedPackage: input.recommendedPackage,
      proposalText: [
        `${input.businessName} is mapped to the ${input.vertical} vertical.`,
        `Recommended package: ${input.recommendedPackage}.`,
        `Observed gaps: ${input.digitalGaps.length > 0 ? input.digitalGaps.join("; ") : "none confirmed yet"}.`,
        "Pricing, legal terms, availability, guarantees, and customer-specific claims must be confirmed by a human before use."
      ].join("\n"),
      sections,
      outreachDraft: "Draft only. Do not send until approval and suppression/opt-out checks are complete.",
      missingData: input.missingData,
      approvalStatus: "pending",
      approvalRequired: true,
      complianceNotes: [
        "Proposal requires admin approval.",
        "Marketing outreach must remain draft-only until opt-out and suppression checks pass."
      ]
    };
  }
}
