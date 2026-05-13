import { z } from "zod";
import { stableHash } from "./hash.js";
import { type AgentRun, type AgentRunLogger, InMemoryAgentRunLogger } from "./run-logger.js";

export const appSpecInputSchema = z.object({
  businessName: z.string().min(1),
  vertical: z.string().default("unknown"),
  recommendedPackage: z.string().default("placeholder_package"),
  proposalId: z.string().min(1),
  missingData: z.array(z.string()).default([])
});

export type AppSpecInput = z.input<typeof appSpecInputSchema>;
type ParsedAppSpecInput = z.infer<typeof appSpecInputSchema>;

export const appSpecOutputSchema = z.object({
  templateId: z.string(),
  theme: z.object({
    style: z.string(),
    primaryColor: z.literal("placeholder")
  }),
  pages: z.array(z.string()),
  features: z.array(z.string()),
  requiredCustomerInputs: z.array(z.string()),
  deploymentTarget: z.literal("preview"),
  approvalRequired: z.literal(true)
});

export type AppSpecOutput = z.infer<typeof appSpecOutputSchema>;

export interface AppSpecResult {
  run: AgentRun;
  output: AppSpecOutput;
}

export class AppSpecAgent {
  readonly name = "AppSpecAgent";

  constructor(private readonly logger: AgentRunLogger = new InMemoryAgentRunLogger()) {}

  async run(input: AppSpecInput): Promise<AppSpecResult> {
    const parsed = appSpecInputSchema.parse(input);
    const run = await this.logger.start({
      agentName: this.name,
      inputHash: stableHash(parsed),
      modelAlias: "coder",
      approvalStatus: "pending",
      metadata: {
        proposal_id: parsed.proposalId,
        vertical: parsed.vertical
      }
    });

    const output = appSpecOutputSchema.parse(this.buildAppSpec(parsed));
    const finishedRun = await this.logger.finish({
      runId: run.id,
      outputHash: stableHash(output),
      approvalStatus: "pending",
      metadata: {
        template_id: output.templateId,
        deployment_target: output.deploymentTarget
      }
    });

    return { run: finishedRun, output };
  }

  private buildAppSpec(input: ParsedAppSpecInput): AppSpecOutput {
    if (input.vertical === "bike_rental") {
      return {
        templateId: "rental-booking-pwa",
        theme: {
          style: "modern practical local rental",
          primaryColor: "placeholder"
        },
        pages: ["home", "bikes", "pricing", "booking", "faq", "contact", "policies"],
        features: ["rental_catalog", "rental_booking_form", "pricing_table", "seo_local_business"],
        requiredCustomerInputs: input.missingData,
        deploymentTarget: "preview",
        approvalRequired: true
      };
    }

    return {
      templateId: "placeholder-template",
      theme: {
        style: "placeholder",
        primaryColor: "placeholder"
      },
      pages: ["home", "services", "contact"],
      features: ["contact_form", "seo_local_business"],
      requiredCustomerInputs: input.missingData,
      deploymentTarget: "preview",
      approvalRequired: true
    };
  }
}
