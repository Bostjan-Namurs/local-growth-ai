import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import {
  businesses,
  sourceRecords,
  websiteAudits,
  type Business,
  type SourceRecord as SourceRecordRow,
  type WebsiteAudit as WebsiteAuditRow
} from "../db/schema.js";
import { type Settings } from "../config.js";

export const businessInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  vertical: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type BusinessInput = z.input<typeof businessInputSchema>;

export interface BusinessRecord extends z.infer<typeof businessInputSchema> {
  id: string;
  normalizedName: string;
  complianceStatus: "unknown" | "pending_review" | "approved" | "restricted" | "rejected" | "expired";
  opportunityScore: number;
  createdAt: string;
  updatedAt: string;
}

export const sourceRecordInputSchema = z.object({
  businessId: z.string().min(1),
  sourceType: z.enum([
    "manual_import",
    "licensed_dataset",
    "osm_extract",
    "google_places",
    "website",
    "customer_submitted",
    "unknown"
  ]),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  licenseName: z.string().optional(),
  allowedUse: z.array(z.string()).default([]),
  disallowedUse: z.array(z.string()).default([]),
  attributionRequired: z.boolean().default(false),
  attributionText: z.string().optional(),
  containsPersonalData: z.boolean().default(false),
  marketingPermission: z.string().default("unknown"),
  complianceStatus: z
    .enum(["unknown", "pending_review", "approved", "restricted", "rejected", "expired"])
    .default("unknown"),
  rawPayloadHash: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type SourceRecordInput = z.input<typeof sourceRecordInputSchema>;

export interface SourceRecord extends z.infer<typeof sourceRecordInputSchema> {
  id: string;
  retentionUntil: string | null;
  collectedAt: string;
  createdAt: string;
}

export const websiteAuditInputSchema = z.object({
  businessId: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  websiteFound: z.boolean().optional(),
  hasHttps: z.boolean().optional(),
  hasMobileLayout: z.boolean().optional(),
  hasBooking: z.boolean().optional(),
  hasMenuOrServices: z.boolean().optional(),
  hasClearCta: z.boolean().optional(),
  seoScore: z.number().int().min(0).max(100).optional(),
  performanceScore: z.number().int().min(0).max(100).optional(),
  issues: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({})
});

export type WebsiteAuditInput = z.input<typeof websiteAuditInputSchema>;

export interface WebsiteAuditRecord extends z.infer<typeof websiteAuditInputSchema> {
  id: string;
  createdAt: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface BusinessStore {
  createBusiness(input: BusinessInput): MaybePromise<BusinessRecord>;
  listBusinesses(): MaybePromise<BusinessRecord[]>;
  getBusiness(id: string): MaybePromise<BusinessRecord>;
  createSourceRecord(input: SourceRecordInput): MaybePromise<SourceRecord>;
  getSourceRecord(businessId: string, sourceRecordId: string): MaybePromise<SourceRecord>;
  updateSourceRecordCompliance(args: {
    businessId: string;
    sourceRecordId: string;
    complianceStatus: SourceRecord["complianceStatus"];
    allowedUse: string[];
    disallowedUse: string[];
    attributionRequired: boolean;
    retentionDays?: number | null;
    metadata?: Record<string, unknown>;
  }): MaybePromise<SourceRecord>;
  listSourceRecords(businessId?: string): MaybePromise<SourceRecord[]>;
  createWebsiteAudit(input: WebsiteAuditInput): MaybePromise<WebsiteAuditRecord>;
  listWebsiteAudits(businessId?: string): MaybePromise<WebsiteAuditRecord[]>;
  clear(): MaybePromise<void>;
}

export class InMemoryBusinessStore {
  private readonly businesses: BusinessRecord[] = [];
  private readonly sourceRecords: SourceRecord[] = [];
  private readonly websiteAudits: WebsiteAuditRecord[] = [];

  createBusiness(input: BusinessInput): BusinessRecord {
    const parsed = businessInputSchema.parse(input);
    const now = new Date().toISOString();
    const record: BusinessRecord = {
      id: crypto.randomUUID(),
      ...parsed,
      normalizedName: normalizeName(parsed.name),
      complianceStatus: "unknown",
      opportunityScore: 0,
      createdAt: now,
      updatedAt: now
    };
    this.businesses.push(record);
    return record;
  }

  listBusinesses(): BusinessRecord[] {
    return [...this.businesses];
  }

  getBusiness(id: string): BusinessRecord {
    const business = this.businesses.find((candidate) => candidate.id === id);
    if (!business) {
      throw new Error(`Unknown business: ${id}`);
    }
    return business;
  }

  createSourceRecord(input: SourceRecordInput): SourceRecord {
    const parsed = sourceRecordInputSchema.parse(input);
    this.getBusiness(parsed.businessId);
    const now = new Date().toISOString();
    const record: SourceRecord = {
      id: crypto.randomUUID(),
      ...parsed,
      retentionUntil: null,
      collectedAt: now,
      createdAt: now
    };
    this.sourceRecords.push(record);
    return record;
  }

  getSourceRecord(businessId: string, sourceRecordId: string): SourceRecord {
    const record = this.sourceRecords.find(
      (candidate) => candidate.businessId === businessId && candidate.id === sourceRecordId
    );
    if (!record) {
      throw new Error(`Unknown source record: ${sourceRecordId}`);
    }
    return record;
  }

  updateSourceRecordCompliance(args: {
    businessId: string;
    sourceRecordId: string;
    complianceStatus: SourceRecord["complianceStatus"];
    allowedUse: string[];
    disallowedUse: string[];
    attributionRequired: boolean;
    retentionDays?: number | null;
    metadata?: Record<string, unknown>;
  }): SourceRecord {
    const record = this.getSourceRecord(args.businessId, args.sourceRecordId);
    record.complianceStatus = args.complianceStatus;
    record.allowedUse = args.allowedUse;
    record.disallowedUse = args.disallowedUse;
    record.attributionRequired = args.attributionRequired;
    record.retentionUntil =
      typeof args.retentionDays === "number" ? retentionDateFromNow(args.retentionDays) : null;
    record.metadata = { ...record.metadata, ...(args.metadata ?? {}) };
    return record;
  }

  listSourceRecords(businessId?: string): SourceRecord[] {
    return this.sourceRecords.filter((record) => !businessId || record.businessId === businessId);
  }

  createWebsiteAudit(input: WebsiteAuditInput): WebsiteAuditRecord {
    const parsed = websiteAuditInputSchema.parse(input);
    this.getBusiness(parsed.businessId);
    const record: WebsiteAuditRecord = {
      id: crypto.randomUUID(),
      ...parsed,
      createdAt: new Date().toISOString()
    };
    this.websiteAudits.push(record);
    return record;
  }

  listWebsiteAudits(businessId?: string): WebsiteAuditRecord[] {
    return this.websiteAudits.filter((record) => !businessId || record.businessId === businessId);
  }

  clear(): void {
    this.businesses.length = 0;
    this.sourceRecords.length = 0;
    this.websiteAudits.length = 0;
  }
}

export class PostgresBusinessStore implements BusinessStore {
  private readonly sql;
  private readonly db;

  constructor(settings: Settings) {
    this.sql = createSqlClient(settings);
    this.db = createDbForSqlClient(this.sql);
  }

  async createBusiness(input: BusinessInput): Promise<BusinessRecord> {
    const parsed = businessInputSchema.parse(input);
    const [record] = await this.db
      .insert(businesses)
      .values({
        name: parsed.name,
        normalizedName: normalizeName(parsed.name),
        category: parsed.category,
        vertical: parsed.vertical,
        address: parsed.address,
        city: parsed.city,
        country: parsed.country,
        phone: parsed.phone,
        email: parsed.email,
        websiteUrl: parsed.websiteUrl,
        metadata: parsed.metadata
      })
      .returning();

    return businessFromRow(record);
  }

  async listBusinesses(): Promise<BusinessRecord[]> {
    const rows = await this.db.select().from(businesses).orderBy(businesses.createdAt);
    return rows.map(businessFromRow);
  }

  async getBusiness(id: string): Promise<BusinessRecord> {
    const [record] = await this.db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!record) {
      throw new Error(`Unknown business: ${id}`);
    }
    return businessFromRow(record);
  }

  async createSourceRecord(input: SourceRecordInput): Promise<SourceRecord> {
    const parsed = sourceRecordInputSchema.parse(input);
    await this.getBusiness(parsed.businessId);

    const [record] = await this.db
      .insert(sourceRecords)
      .values({
        businessId: parsed.businessId,
        sourceType: parsed.sourceType,
        sourceName: parsed.sourceName,
        sourceUrl: parsed.sourceUrl,
        licenseName: parsed.licenseName,
        allowedUse: parsed.allowedUse,
        disallowedUse: parsed.disallowedUse,
        attributionRequired: parsed.attributionRequired,
        attributionText: parsed.attributionText,
        containsPersonalData: parsed.containsPersonalData,
        marketingPermission: parsed.marketingPermission,
        complianceStatus: parsed.complianceStatus,
        rawPayloadHash: parsed.rawPayloadHash,
        metadata: parsed.metadata
      })
      .returning();

    return sourceRecordFromRow(record);
  }

  async getSourceRecord(businessId: string, sourceRecordId: string): Promise<SourceRecord> {
    const [record] = await this.db
      .select()
      .from(sourceRecords)
      .where(eq(sourceRecords.id, sourceRecordId))
      .limit(1);
    if (!record || record.businessId !== businessId) {
      throw new Error(`Unknown source record: ${sourceRecordId}`);
    }
    return sourceRecordFromRow(record);
  }

  async updateSourceRecordCompliance(args: {
    businessId: string;
    sourceRecordId: string;
    complianceStatus: SourceRecord["complianceStatus"];
    allowedUse: string[];
    disallowedUse: string[];
    attributionRequired: boolean;
    retentionDays?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<SourceRecord> {
    const current = await this.getSourceRecord(args.businessId, args.sourceRecordId);
    const [record] = await this.db
      .update(sourceRecords)
      .set({
        complianceStatus: args.complianceStatus,
        allowedUse: args.allowedUse,
        disallowedUse: args.disallowedUse,
        attributionRequired: args.attributionRequired,
        retentionUntil:
          typeof args.retentionDays === "number" ? new Date(retentionDateFromNow(args.retentionDays)) : null,
        metadata: { ...current.metadata, ...(args.metadata ?? {}) }
      })
      .where(eq(sourceRecords.id, args.sourceRecordId))
      .returning();

    return sourceRecordFromRow(record);
  }

  async listSourceRecords(businessId?: string): Promise<SourceRecord[]> {
    const rows = businessId
      ? await this.db.select().from(sourceRecords).where(eq(sourceRecords.businessId, businessId))
      : await this.db.select().from(sourceRecords);
    return rows.map(sourceRecordFromRow);
  }

  async createWebsiteAudit(input: WebsiteAuditInput): Promise<WebsiteAuditRecord> {
    const parsed = websiteAuditInputSchema.parse(input);
    await this.getBusiness(parsed.businessId);

    const [record] = await this.db
      .insert(websiteAudits)
      .values({
        businessId: parsed.businessId,
        websiteUrl: parsed.websiteUrl,
        websiteFound: parsed.websiteFound,
        hasHttps: parsed.hasHttps,
        hasMobileLayout: parsed.hasMobileLayout,
        hasBooking: parsed.hasBooking,
        hasMenuOrServices: parsed.hasMenuOrServices,
        hasClearCta: parsed.hasClearCta,
        seoScore: parsed.seoScore,
        performanceScore: parsed.performanceScore,
        issues: parsed.issues,
        metadata: parsed.metadata
      })
      .returning();

    return websiteAuditFromRow(record);
  }

  async listWebsiteAudits(businessId?: string): Promise<WebsiteAuditRecord[]> {
    const rows = businessId
      ? await this.db.select().from(websiteAudits).where(eq(websiteAudits.businessId, businessId))
      : await this.db.select().from(websiteAudits);
    return rows.map(websiteAuditFromRow);
  }

  async clear(): Promise<void> {
    await this.db.delete(websiteAudits);
    await this.db.delete(sourceRecords);
    await this.db.delete(businesses);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function retentionDateFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function businessFromRow(row: Business): BusinessRecord {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName ?? normalizeName(row.name),
    category: optional(row.category),
    vertical: optional(row.vertical),
    address: optional(row.address),
    city: optional(row.city),
    country: optional(row.country),
    phone: optional(row.phone),
    email: optional(row.email),
    websiteUrl: optional(row.websiteUrl),
    metadata: jsonRecord(row.metadata),
    complianceStatus: row.complianceStatus,
    opportunityScore: row.opportunityScore,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function sourceRecordFromRow(row: SourceRecordRow): SourceRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    sourceType: sourceRecordInputSchema.shape.sourceType.parse(row.sourceType),
    sourceName: optional(row.sourceName),
    sourceUrl: optional(row.sourceUrl),
    licenseName: optional(row.licenseName),
    allowedUse: row.allowedUse,
    disallowedUse: row.disallowedUse,
    attributionRequired: row.attributionRequired,
    attributionText: optional(row.attributionText),
    containsPersonalData: row.containsPersonalData,
    marketingPermission: row.marketingPermission,
    complianceStatus: row.complianceStatus,
    rawPayloadHash: optional(row.rawPayloadHash),
    metadata: jsonRecord(row.metadata),
    retentionUntil: row.retentionUntil ? row.retentionUntil.toISOString() : null,
    collectedAt: row.collectedAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function websiteAuditFromRow(row: WebsiteAuditRow): WebsiteAuditRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    websiteUrl: optional(row.websiteUrl),
    websiteFound: optional(row.websiteFound),
    hasHttps: optional(row.hasHttps),
    hasMobileLayout: optional(row.hasMobileLayout),
    hasBooking: optional(row.hasBooking),
    hasMenuOrServices: optional(row.hasMenuOrServices),
    hasClearCta: optional(row.hasClearCta),
    seoScore: optional(row.seoScore),
    performanceScore: optional(row.performanceScore),
    issues: row.issues,
    metadata: jsonRecord(row.metadata),
    createdAt: row.createdAt.toISOString()
  };
}

export function createBusinessStore(settings: Settings): BusinessStore {
  if (settings.dataStore === "postgres") {
    return new PostgresBusinessStore(settings);
  }
  return businessStore;
}

export const businessStore = new InMemoryBusinessStore();
