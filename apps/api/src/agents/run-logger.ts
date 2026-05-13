import { desc, eq } from "drizzle-orm";
import { type Settings } from "../config.js";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import { agentRuns, type AgentRunRecord } from "../db/schema.js";

export type AgentRunStatus = "running" | "completed" | "failed";
export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export interface AgentRunEvent {
  runId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  agentName: string;
  inputHash: string;
  outputHash?: string;
  modelAlias?: string;
  approvalStatus: ApprovalStatus;
  status: AgentRunStatus;
  error?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  events: AgentRunEvent[];
}

type MaybePromise<T> = T | Promise<T>;

export interface AgentRunLogger {
  start(args: {
    agentName: string;
    inputHash: string;
    modelAlias?: string;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): MaybePromise<AgentRun>;
  finish(args: {
    runId: string;
    outputHash: string;
    status?: AgentRunStatus;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): MaybePromise<AgentRun>;
  fail(runId: string, error: string): MaybePromise<AgentRun>;
  get(runId: string): MaybePromise<AgentRun>;
  list(): MaybePromise<AgentRun[]>;
  toLogEvent(run: AgentRun): Record<string, unknown>;
}

export class InMemoryAgentRunLogger implements AgentRunLogger {
  readonly runs: AgentRun[] = [];

  start(args: {
    agentName: string;
    inputHash: string;
    modelAlias?: string;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): AgentRun {
    const now = new Date().toISOString();
    const run: AgentRun = {
      id: crypto.randomUUID(),
      agentName: args.agentName,
      inputHash: args.inputHash,
      modelAlias: args.modelAlias,
      approvalStatus: args.approvalStatus ?? "not_required",
      status: "running",
      metadata: args.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      events: []
    };
    this.appendEvent(run, "agent_run_started", this.toLogEvent(run));
    this.runs.push(run);
    return run;
  }

  finish(args: {
    runId: string;
    outputHash: string;
    status?: AgentRunStatus;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): AgentRun {
    const run = this.get(args.runId);
    run.outputHash = args.outputHash;
    run.status = args.status ?? "completed";
    run.approvalStatus = args.approvalStatus ?? run.approvalStatus;
    run.metadata = { ...run.metadata, ...(args.metadata ?? {}) };
    run.updatedAt = new Date().toISOString();
    this.appendEvent(run, "agent_run_finished", this.toLogEvent(run));
    return run;
  }

  fail(runId: string, error: string): AgentRun {
    const run = this.get(runId);
    run.status = "failed";
    run.error = error;
    run.updatedAt = new Date().toISOString();
    this.appendEvent(run, "agent_run_failed", { error });
    return run;
  }

  get(runId: string): AgentRun {
    const run = this.runs.find((candidate) => candidate.id === runId);
    if (!run) {
      throw new Error(`Unknown agent run: ${runId}`);
    }
    return run;
  }

  list(): AgentRun[] {
    return [...this.runs].reverse();
  }

  toLogEvent(run: AgentRun): Record<string, unknown> {
    return {
      run_id: run.id,
      agent_name: run.agentName,
      status: run.status,
      input_hash: run.inputHash,
      output_hash: run.outputHash,
      model_alias: run.modelAlias,
      approval_status: run.approvalStatus,
      error: run.error,
      metadata: run.metadata,
      created_at: run.createdAt,
      updated_at: run.updatedAt
    };
  }

  private appendEvent(run: AgentRun, eventType: string, payload: Record<string, unknown>): void {
    run.events.push({
      runId: run.id,
      eventType,
      payload,
      createdAt: new Date().toISOString()
    });
  }
}

export class PostgresAgentRunLogger implements AgentRunLogger {
  private readonly sql;
  private readonly db;

  constructor(settings: Settings) {
    this.sql = createSqlClient(settings);
    this.db = createDbForSqlClient(this.sql);
  }

  async start(args: {
    agentName: string;
    inputHash: string;
    modelAlias?: string;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): Promise<AgentRun> {
    const [record] = await this.db
      .insert(agentRuns)
      .values({
        agentName: args.agentName,
        inputHash: args.inputHash,
        modelAlias: args.modelAlias,
        approvalStatus: args.approvalStatus ?? "not_required",
        inputJson: args.metadata ?? {},
        status: "running",
        startedAt: new Date()
      })
      .returning();

    return this.withEvent(agentRunFromRow(record), "agent_run_started");
  }

  async finish(args: {
    runId: string;
    outputHash: string;
    status?: AgentRunStatus;
    approvalStatus?: ApprovalStatus;
    metadata?: Record<string, unknown>;
  }): Promise<AgentRun> {
    const current = await this.get(args.runId);
    const [record] = await this.db
      .update(agentRuns)
      .set({
        outputHash: args.outputHash,
        outputJson: args.metadata ?? {},
        status: args.status ?? "completed",
        approvalStatus: args.approvalStatus ?? current.approvalStatus,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(agentRuns.id, args.runId))
      .returning();

    return this.withEvent(agentRunFromRow(record), "agent_run_finished");
  }

  async fail(runId: string, error: string): Promise<AgentRun> {
    const [record] = await this.db
      .update(agentRuns)
      .set({
        status: "failed",
        errorMessage: error,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(agentRuns.id, runId))
      .returning();

    return this.withEvent(agentRunFromRow(record), "agent_run_failed", { error });
  }

  async get(runId: string): Promise<AgentRun> {
    const [record] = await this.db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
    if (!record) {
      throw new Error(`Unknown agent run: ${runId}`);
    }
    return agentRunFromRow(record);
  }

  async list(): Promise<AgentRun[]> {
    const records = await this.db
      .select()
      .from(agentRuns)
      .orderBy(desc(agentRuns.createdAt))
      .limit(100);
    return records.map(agentRunFromRow);
  }

  toLogEvent(run: AgentRun): Record<string, unknown> {
    return toLogEvent(run);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  private withEvent(run: AgentRun, eventType: string, payload = this.toLogEvent(run)): AgentRun {
    run.events.push({
      runId: run.id,
      eventType,
      payload,
      createdAt: new Date().toISOString()
    });
    return run;
  }
}

function agentRunFromRow(row: AgentRunRecord): AgentRun {
  return {
    id: row.id,
    agentName: row.agentName,
    inputHash: row.inputHash ?? "",
    outputHash: row.outputHash ?? undefined,
    modelAlias: row.modelAlias ?? undefined,
    approvalStatus: approvalStatusFromDb(row.approvalStatus),
    status: agentRunStatusFromDb(row.status),
    error: row.errorMessage ?? undefined,
    metadata: agentRunMetadataFromJson(row.inputJson, row.outputJson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    events: []
  };
}

export function agentRunMetadataFromJson(
  inputJson: unknown,
  outputJson: unknown
): Record<string, unknown> {
  return {
    ...jsonRecord(inputJson),
    ...jsonRecord(outputJson)
  };
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function agentRunStatusFromDb(status: AgentRunRecord["status"]): AgentRunStatus {
  if (status === "completed" || status === "failed") return status;
  return "running";
}

function approvalStatusFromDb(status: string): ApprovalStatus {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return "not_required";
}

function toLogEvent(run: AgentRun): Record<string, unknown> {
  return {
    run_id: run.id,
    agent_name: run.agentName,
    status: run.status,
    input_hash: run.inputHash,
    output_hash: run.outputHash,
    model_alias: run.modelAlias,
    approval_status: run.approvalStatus,
    error: run.error,
    metadata: run.metadata,
    created_at: run.createdAt,
    updated_at: run.updatedAt
  };
}

export function createAgentRunLogger(settings: Settings): AgentRunLogger {
  if (settings.dataStore === "postgres") {
    return new PostgresAgentRunLogger(settings);
  }
  return new InMemoryAgentRunLogger();
}
