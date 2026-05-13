import { z } from "zod";
import type { Settings } from "../config.js";

export const modelAliasSchema = z.enum([
  "classifier",
  "extractor",
  "profiler",
  "writer",
  "proposal_writer",
  "content_writer",
  "coder",
  "judge",
  "embedding"
]);

export type ModelAlias = z.infer<typeof modelAliasSchema>;

export const llmRequestSchema = z.object({
  modelAlias: modelAliasSchema,
  task: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  promptVersion: z.string().default("fake-v1")
});

export type LlmRequest = z.infer<typeof llmRequestSchema>;

export interface LlmResponse {
  modelAlias: ModelAlias;
  content: Record<string, unknown>;
  fake: boolean;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export class LlmClient {
  constructor(private readonly settings: Settings) {}

  complete(input: LlmRequest): LlmResponse {
    const request = llmRequestSchema.parse(input);
    if (this.settings.llmMode === "fake") {
      return this.fakeComplete(request);
    }
    return this.gatewayComplete(request);
  }

  protected gatewayComplete(_request: LlmRequest): LlmResponse {
    throw new Error("Real LLM gateway calls are intentionally deferred from Sprint 1");
  }

  private fakeComplete(request: LlmRequest): LlmResponse {
    if (request.modelAlias === "classifier") {
      const text = String(request.input.text ?? "").toLowerCase();
      const verticalId = text.includes("bike") || text.includes("bicycle") ? "bike_rental" : "unknown";
      return this.response(request, {
        vertical_id: verticalId,
        confidence: verticalId === "unknown" ? 0 : 0.91,
        missing_data: []
      });
    }

    if (request.modelAlias === "judge") {
      return this.response(request, {
        passed: true,
        issues: [],
        approval_required: false
      });
    }

    if (request.modelAlias === "writer" || request.modelAlias === "proposal_writer") {
      return this.response(request, {
        title: "Fake proposal draft",
        sections: [
          "business_summary",
          "observed_gaps",
          "recommended_package",
          "required_customer_inputs"
        ],
        missing_data: ["Confirm customer facts before approval"],
        approval_required: true
      });
    }

    if (request.modelAlias === "embedding") {
      return this.response(request, {
        embedding: [0, 0.1, 0.2],
        dimensions: 3
      });
    }

    return this.response(request, {
      result: `${request.modelAlias} fake response`,
      missing_data: [],
      approval_required: ["writer", "content_writer", "coder"].includes(request.modelAlias)
    });
  }

  private response(request: LlmRequest, content: Record<string, unknown>): LlmResponse {
    const inputTokens = Math.max(1, Math.floor(JSON.stringify(request.input).length / 4));
    return {
      modelAlias: request.modelAlias,
      content,
      fake: true,
      usage: {
        inputTokens,
        outputTokens: 16,
        totalTokens: inputTokens + 16
      }
    };
  }
}
