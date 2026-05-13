import { desc } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { type Settings } from "../config.js";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import { approvals, type ApprovalRecord as ApprovalRow } from "../db/schema.js";

export const approvalDecisionSchema = z.enum(["pending", "approved", "rejected", "needs_changes"]);

export const createApprovalSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  decision: approvalDecisionSchema,
  notes: z.string().optional(),
  approvedBy: z.string().optional()
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

export interface ApprovalRecord extends CreateApprovalInput {
  id: string;
  createdAt: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface ApprovalStore {
  create(input: CreateApprovalInput): MaybePromise<ApprovalRecord>;
  list(): MaybePromise<ApprovalRecord[]>;
  latestFor(entityType: string, entityId: string): MaybePromise<ApprovalRecord | undefined>;
  hasApproved(entityType: string, entityId: string): MaybePromise<boolean>;
  clear(): MaybePromise<void>;
}

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly records: ApprovalRecord[] = [];

  create(input: CreateApprovalInput): ApprovalRecord {
    const parsed = createApprovalSchema.parse(input);
    const record: ApprovalRecord = {
      id: crypto.randomUUID(),
      ...parsed,
      createdAt: new Date().toISOString()
    };
    this.records.push(record);
    return record;
  }

  list(): ApprovalRecord[] {
    return [...this.records];
  }

  latestFor(entityType: string, entityId: string): ApprovalRecord | undefined {
    return this.records
      .filter((record) => record.entityType === entityType && record.entityId === entityId)
      .at(-1);
  }

  hasApproved(entityType: string, entityId: string): boolean {
    return this.latestFor(entityType, entityId)?.decision === "approved";
  }

  clear(): void {
    this.records.length = 0;
  }
}

export class PostgresApprovalStore implements ApprovalStore {
  private readonly sql;
  private readonly db;

  constructor(settings: Settings) {
    this.sql = createSqlClient(settings);
    this.db = createDbForSqlClient(this.sql);
  }

  async create(input: CreateApprovalInput): Promise<ApprovalRecord> {
    const parsed = createApprovalSchema.parse(input);
    const [record] = await this.db
      .insert(approvals)
      .values({
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        decision: parsed.decision,
        notes: parsed.notes,
        approvedBy: parsed.approvedBy
      })
      .returning();
    return approvalFromRow(record);
  }

  async list(): Promise<ApprovalRecord[]> {
    const rows = await this.db.select().from(approvals).orderBy(approvals.createdAt);
    return rows.map(approvalFromRow);
  }

  async latestFor(entityType: string, entityId: string): Promise<ApprovalRecord | undefined> {
    const [record] = await this.db
      .select()
      .from(approvals)
      .where(and(eq(approvals.entityType, entityType), eq(approvals.entityId, entityId)))
      .orderBy(desc(approvals.createdAt))
      .limit(1);
    return record ? approvalFromRow(record) : undefined;
  }

  async hasApproved(entityType: string, entityId: string): Promise<boolean> {
    return (await this.latestFor(entityType, entityId))?.decision === "approved";
  }

  async clear(): Promise<void> {
    await this.db.delete(approvals);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

function approvalFromRow(row: ApprovalRow): ApprovalRecord {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    decision: row.decision,
    notes: row.notes ?? undefined,
    approvedBy: row.approvedBy ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

export function createApprovalStore(settings: Settings): ApprovalStore {
  if (settings.dataStore === "postgres") {
    return new PostgresApprovalStore(settings);
  }
  return approvalStore;
}

export const approvalStore = new InMemoryApprovalStore();
