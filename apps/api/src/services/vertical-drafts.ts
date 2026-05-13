import { type Settings } from "../config.js";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import { verticalDrafts, type VerticalDraftRecord as VerticalDraftRow } from "../db/schema.js";
import { z } from "zod";

export const verticalDraftInputSchema = z.object({
  verticalId: z.string().min(1).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  appPattern: z.string().min(1),
  templateId: z.string().min(1),
  wizardPayload: z.record(z.unknown()).default({}),
  riskFlags: z.array(z.string()).default([])
});

export type CreateVerticalDraftInput = z.input<typeof verticalDraftInputSchema>;

export interface VerticalDraftRecord extends z.infer<typeof verticalDraftInputSchema> {
  id: string;
  status: "draft";
  createdAt: string;
  updatedAt: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface VerticalDraftStore {
  create(input: CreateVerticalDraftInput): MaybePromise<VerticalDraftRecord>;
  list(): MaybePromise<VerticalDraftRecord[]>;
  clear(): MaybePromise<void>;
}

export class InMemoryVerticalDraftStore implements VerticalDraftStore {
  private readonly records: VerticalDraftRecord[] = [];

  create(input: CreateVerticalDraftInput): VerticalDraftRecord {
    const parsed = verticalDraftInputSchema.parse(input);
    const now = new Date().toISOString();
    const record: VerticalDraftRecord = {
      id: crypto.randomUUID(),
      status: "draft",
      ...parsed,
      riskFlags: [...new Set([...parsed.riskFlags, "requires_human_review"])],
      createdAt: now,
      updatedAt: now
    };
    this.records.push(record);
    return record;
  }

  list(): VerticalDraftRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records.length = 0;
  }
}

export class PostgresVerticalDraftStore implements VerticalDraftStore {
  private readonly sql;
  private readonly db;

  constructor(settings: Settings) {
    this.sql = createSqlClient(settings);
    this.db = createDbForSqlClient(this.sql);
  }

  async create(input: CreateVerticalDraftInput): Promise<VerticalDraftRecord> {
    const parsed = verticalDraftInputSchema.parse(input);
    const riskFlags = [...new Set([...parsed.riskFlags, "requires_human_review"])];
    const wizardPayload = {
      ...parsed.wizardPayload,
      name: parsed.name,
      appPattern: parsed.appPattern,
      templateId: parsed.templateId
    };

    const [record] = await this.db
      .insert(verticalDrafts)
      .values({
        verticalId: parsed.verticalId,
        status: "draft",
        wizardPayload,
        riskFlags
      })
      .returning();

    return verticalDraftFromRow(record);
  }

  async list(): Promise<VerticalDraftRecord[]> {
    const rows = await this.db.select().from(verticalDrafts).orderBy(verticalDrafts.createdAt);
    return rows.map(verticalDraftFromRow);
  }

  async clear(): Promise<void> {
    await this.db.delete(verticalDrafts);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function verticalDraftFromRow(row: VerticalDraftRow): VerticalDraftRecord {
  const wizardPayload = asRecord(row.wizardPayload);
  return {
    id: row.id,
    verticalId: row.verticalId,
    name: asString(wizardPayload.name, row.verticalId),
    appPattern: asString(wizardPayload.appPattern, "unknown"),
    templateId: asString(wizardPayload.templateId, "unknown"),
    wizardPayload,
    riskFlags: asStringArray(row.riskFlags),
    status: "draft",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function createVerticalDraftStore(settings: Settings): VerticalDraftStore {
  if (settings.dataStore === "postgres") {
    return new PostgresVerticalDraftStore(settings);
  }
  return verticalDraftStore;
}

export const verticalDraftStore = new InMemoryVerticalDraftStore();
