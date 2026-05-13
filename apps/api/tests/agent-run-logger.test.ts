import { describe, expect, it } from "vitest";
import { InMemoryAgentRunLogger, agentRunMetadataFromJson } from "../src/agents/run-logger.js";

describe("agent run logger", () => {
  it("records auditable start and finish events", () => {
    const logger = new InMemoryAgentRunLogger();
    const run = logger.start({
      agentName: "SourceComplianceAgent",
      inputHash: "abc123",
      modelAlias: "classifier",
      approvalStatus: "pending",
      metadata: { business_id: "business-1" }
    });
    expect(run.status).toBe("running");

    const finished = logger.finish({
      runId: run.id,
      outputHash: "def456",
      approvalStatus: "approved",
      metadata: { source_record_id: "source-1" }
    });

    expect(finished.status).toBe("completed");
    expect(finished.outputHash).toBe("def456");
    expect(finished.modelAlias).toBe("classifier");
    expect(finished.approvalStatus).toBe("approved");
    expect(finished.metadata).toEqual({
      business_id: "business-1",
      source_record_id: "source-1"
    });
    expect(finished.events.map((event) => event.eventType)).toEqual([
      "agent_run_started",
      "agent_run_finished"
    ]);
    expect(logger.toLogEvent(finished).input_hash).toBe("abc123");
  });

  it("records failures", () => {
    const logger = new InMemoryAgentRunLogger();
    const run = logger.start({
      agentName: "ProposalAgent",
      inputHash: "input-hash",
      modelAlias: "proposal_writer"
    });

    const failed = logger.fail(run.id, "schema validation failed");

    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("schema validation failed");
    expect(failed.events.at(-1)?.eventType).toBe("agent_run_failed");
  });

  it("lists runs for audit views", () => {
    const logger = new InMemoryAgentRunLogger();
    const first = logger.start({
      agentName: "BusinessProfileAgent",
      inputHash: "first"
    });
    const second = logger.start({
      agentName: "ProposalAgent",
      inputHash: "second"
    });

    expect(logger.list().map((run) => run.id)).toEqual([second.id, first.id]);
  });

  it("hydrates persisted metadata from input and output JSON", () => {
    expect(
      agentRunMetadataFromJson(
        { business_id: "business-1", phase: "start" },
        { source_record_id: "source-1", phase: "finish" }
      )
    ).toEqual({
      business_id: "business-1",
      source_record_id: "source-1",
      phase: "finish"
    });

    expect(agentRunMetadataFromJson([], null)).toEqual({});
  });
});
