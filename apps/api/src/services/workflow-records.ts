import { desc, eq } from "drizzle-orm";
import { type BusinessProfileOutput } from "../agents/business-profile.js";
import { type AppSpecOutput } from "../agents/app-spec.js";
import { type ProposalOutput } from "../agents/proposal.js";
import { type Settings } from "../config.js";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import {
  businessProfiles,
  generatedApps,
  previewBuilds,
  proposals,
  type BusinessProfileRecord as BusinessProfileRow,
  type GeneratedAppRecord as GeneratedAppRow,
  type PreviewBuildRecord as PreviewBuildRow,
  type ProposalRecord as ProposalRow
} from "../db/schema.js";

export interface BusinessProfileRecord {
  id: string;
  businessId: string;
  agentRunId: string;
  output: BusinessProfileOutput;
  approvalStatus: "pending" | "approved" | "rejected" | "needs_changes";
  createdAt: string;
}

export interface ProposalRecord {
  id: string;
  businessId: string;
  businessProfileId: string;
  agentRunId: string;
  output: ProposalOutput;
  approvalStatus: "pending" | "approved" | "rejected" | "needs_changes";
  createdAt: string;
}

export interface GeneratedAppRecord {
  id: string;
  businessId: string;
  proposalId: string;
  agentRunId: string;
  appSpec: AppSpecOutput;
  deploymentStatus: "draft";
  approvalStatus: "pending";
  createdAt: string;
}

export interface PreviewBuildRecord {
  id: string;
  generatedAppId: string;
  buildType: "preview";
  status: "queued";
  createdAt: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface WorkflowStore {
  createBusinessProfile(args: {
    businessId: string;
    agentRunId: string;
    output: BusinessProfileOutput;
  }): MaybePromise<BusinessProfileRecord>;
  listBusinessProfiles(businessId?: string): MaybePromise<BusinessProfileRecord[]>;
  latestBusinessProfile(businessId: string): MaybePromise<BusinessProfileRecord>;
  createProposal(args: {
    businessId: string;
    businessProfileId: string;
    agentRunId: string;
    output: ProposalOutput;
  }): MaybePromise<ProposalRecord>;
  listProposals(businessId?: string): MaybePromise<ProposalRecord[]>;
  getProposal(businessId: string, proposalId: string): MaybePromise<ProposalRecord>;
  createGeneratedApp(args: {
    businessId: string;
    proposalId: string;
    agentRunId: string;
    appSpec: AppSpecOutput;
  }): MaybePromise<GeneratedAppRecord>;
  getGeneratedApp(generatedAppId: string): MaybePromise<GeneratedAppRecord>;
  listGeneratedApps(businessId?: string): MaybePromise<GeneratedAppRecord[]>;
  createPreviewBuild(generatedAppId: string): MaybePromise<PreviewBuildRecord>;
  listPreviewBuilds(generatedAppId: string): MaybePromise<PreviewBuildRecord[]>;
  clear(): MaybePromise<void>;
}

export class InMemoryWorkflowStore implements WorkflowStore {
  private readonly businessProfiles: BusinessProfileRecord[] = [];
  private readonly proposals: ProposalRecord[] = [];
  private readonly generatedApps: GeneratedAppRecord[] = [];
  private readonly previewBuilds: PreviewBuildRecord[] = [];

  createBusinessProfile(args: {
    businessId: string;
    agentRunId: string;
    output: BusinessProfileOutput;
  }): BusinessProfileRecord {
    const record: BusinessProfileRecord = {
      id: crypto.randomUUID(),
      businessId: args.businessId,
      agentRunId: args.agentRunId,
      output: args.output,
      approvalStatus: "pending",
      createdAt: new Date().toISOString()
    };
    this.businessProfiles.push(record);
    return record;
  }

  listBusinessProfiles(businessId?: string): BusinessProfileRecord[] {
    return this.businessProfiles.filter((record) => !businessId || record.businessId === businessId);
  }

  latestBusinessProfile(businessId: string): BusinessProfileRecord {
    const profile = this.listBusinessProfiles(businessId).at(-1);
    if (!profile) {
      throw new Error(`No business profile exists for business: ${businessId}`);
    }
    return profile;
  }

  createProposal(args: {
    businessId: string;
    businessProfileId: string;
    agentRunId: string;
    output: ProposalOutput;
  }): ProposalRecord {
    const record: ProposalRecord = {
      id: crypto.randomUUID(),
      businessId: args.businessId,
      businessProfileId: args.businessProfileId,
      agentRunId: args.agentRunId,
      output: args.output,
      approvalStatus: "pending",
      createdAt: new Date().toISOString()
    };
    this.proposals.push(record);
    return record;
  }

  listProposals(businessId?: string): ProposalRecord[] {
    return this.proposals.filter((record) => !businessId || record.businessId === businessId);
  }

  getProposal(businessId: string, proposalId: string): ProposalRecord {
    const proposal = this.proposals.find(
      (record) => record.businessId === businessId && record.id === proposalId
    );
    if (!proposal) {
      throw new Error(`Unknown proposal: ${proposalId}`);
    }
    return proposal;
  }

  createGeneratedApp(args: {
    businessId: string;
    proposalId: string;
    agentRunId: string;
    appSpec: AppSpecOutput;
  }): GeneratedAppRecord {
    const record: GeneratedAppRecord = {
      id: crypto.randomUUID(),
      businessId: args.businessId,
      proposalId: args.proposalId,
      agentRunId: args.agentRunId,
      appSpec: args.appSpec,
      deploymentStatus: "draft",
      approvalStatus: "pending",
      createdAt: new Date().toISOString()
    };
    this.generatedApps.push(record);
    return record;
  }

  getGeneratedApp(generatedAppId: string): GeneratedAppRecord {
    const generatedApp = this.generatedApps.find((record) => record.id === generatedAppId);
    if (!generatedApp) {
      throw new Error(`Unknown generated app: ${generatedAppId}`);
    }
    return generatedApp;
  }

  listGeneratedApps(businessId?: string): GeneratedAppRecord[] {
    return this.generatedApps.filter((record) => !businessId || record.businessId === businessId);
  }

  createPreviewBuild(generatedAppId: string): PreviewBuildRecord {
    this.getGeneratedApp(generatedAppId);
    const record: PreviewBuildRecord = {
      id: crypto.randomUUID(),
      generatedAppId,
      buildType: "preview",
      status: "queued",
      createdAt: new Date().toISOString()
    };
    this.previewBuilds.push(record);
    return record;
  }

  listPreviewBuilds(generatedAppId: string): PreviewBuildRecord[] {
    return this.previewBuilds.filter((record) => record.generatedAppId === generatedAppId);
  }

  clear(): void {
    this.businessProfiles.length = 0;
    this.proposals.length = 0;
    this.generatedApps.length = 0;
    this.previewBuilds.length = 0;
  }
}

export class PostgresWorkflowStore implements WorkflowStore {
  private readonly sql;
  private readonly db;

  constructor(settings: Settings) {
    this.sql = createSqlClient(settings);
    this.db = createDbForSqlClient(this.sql);
  }

  async createBusinessProfile(args: {
    businessId: string;
    agentRunId: string;
    output: BusinessProfileOutput;
  }): Promise<BusinessProfileRecord> {
    const [record] = await this.db
      .insert(businessProfiles)
      .values({
        businessId: args.businessId,
        agentRunId: args.agentRunId,
        output: args.output
      })
      .returning();
    return businessProfileFromRow(record);
  }

  async listBusinessProfiles(businessId?: string): Promise<BusinessProfileRecord[]> {
    const rows = businessId
      ? await this.db.select().from(businessProfiles).where(eq(businessProfiles.businessId, businessId))
      : await this.db.select().from(businessProfiles);
    return rows.map(businessProfileFromRow);
  }

  async latestBusinessProfile(businessId: string): Promise<BusinessProfileRecord> {
    const [record] = await this.db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.businessId, businessId))
      .orderBy(desc(businessProfiles.createdAt))
      .limit(1);
    if (!record) {
      throw new Error(`No business profile exists for business: ${businessId}`);
    }
    return businessProfileFromRow(record);
  }

  async createProposal(args: {
    businessId: string;
    businessProfileId: string;
    agentRunId: string;
    output: ProposalOutput;
  }): Promise<ProposalRecord> {
    const [record] = await this.db
      .insert(proposals)
      .values({
        businessId: args.businessId,
        businessProfileId: args.businessProfileId,
        agentRunId: args.agentRunId,
        output: args.output
      })
      .returning();
    return proposalFromRow(record);
  }

  async listProposals(businessId?: string): Promise<ProposalRecord[]> {
    const rows = businessId
      ? await this.db.select().from(proposals).where(eq(proposals.businessId, businessId))
      : await this.db.select().from(proposals);
    return rows.map(proposalFromRow);
  }

  async getProposal(businessId: string, proposalId: string): Promise<ProposalRecord> {
    const [record] = await this.db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
    if (!record || record.businessId !== businessId) {
      throw new Error(`Unknown proposal: ${proposalId}`);
    }
    return proposalFromRow(record);
  }

  async createGeneratedApp(args: {
    businessId: string;
    proposalId: string;
    agentRunId: string;
    appSpec: AppSpecOutput;
  }): Promise<GeneratedAppRecord> {
    const [record] = await this.db
      .insert(generatedApps)
      .values({
        businessId: args.businessId,
        proposalId: args.proposalId,
        agentRunId: args.agentRunId,
        appSpec: args.appSpec,
        deploymentStatus: "draft",
        approvalStatus: "pending"
      })
      .returning();
    return generatedAppFromRow(record);
  }

  async getGeneratedApp(generatedAppId: string): Promise<GeneratedAppRecord> {
    const [record] = await this.db
      .select()
      .from(generatedApps)
      .where(eq(generatedApps.id, generatedAppId))
      .limit(1);
    if (!record) {
      throw new Error(`Unknown generated app: ${generatedAppId}`);
    }
    return generatedAppFromRow(record);
  }

  async listGeneratedApps(businessId?: string): Promise<GeneratedAppRecord[]> {
    const rows = businessId
      ? await this.db.select().from(generatedApps).where(eq(generatedApps.businessId, businessId))
      : await this.db.select().from(generatedApps);
    return rows.map(generatedAppFromRow);
  }

  async createPreviewBuild(generatedAppId: string): Promise<PreviewBuildRecord> {
    await this.getGeneratedApp(generatedAppId);
    const [record] = await this.db
      .insert(previewBuilds)
      .values({
        generatedAppId,
        buildType: "preview",
        status: "queued"
      })
      .returning();
    return previewBuildFromRow(record);
  }

  async listPreviewBuilds(generatedAppId: string): Promise<PreviewBuildRecord[]> {
    const rows = await this.db
      .select()
      .from(previewBuilds)
      .where(eq(previewBuilds.generatedAppId, generatedAppId));
    return rows.map(previewBuildFromRow);
  }

  async clear(): Promise<void> {
    await this.db.delete(previewBuilds);
    await this.db.delete(generatedApps);
    await this.db.delete(proposals);
    await this.db.delete(businessProfiles);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

function asBusinessProfileOutput(value: unknown): BusinessProfileOutput {
  return value as BusinessProfileOutput;
}

function asProposalOutput(value: unknown): ProposalOutput {
  return value as ProposalOutput;
}

function asAppSpecOutput(value: unknown): AppSpecOutput {
  return value as AppSpecOutput;
}

function businessProfileFromRow(row: BusinessProfileRow): BusinessProfileRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    agentRunId: row.agentRunId,
    output: asBusinessProfileOutput(row.output),
    approvalStatus: row.approvalStatus,
    createdAt: row.createdAt.toISOString()
  };
}

function proposalFromRow(row: ProposalRow): ProposalRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    businessProfileId: row.businessProfileId,
    agentRunId: row.agentRunId,
    output: asProposalOutput(row.output),
    approvalStatus: row.approvalStatus,
    createdAt: row.createdAt.toISOString()
  };
}

function generatedAppFromRow(row: GeneratedAppRow): GeneratedAppRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    proposalId: row.proposalId,
    agentRunId: row.agentRunId,
    appSpec: asAppSpecOutput(row.appSpec),
    deploymentStatus: "draft",
    approvalStatus: "pending",
    createdAt: row.createdAt.toISOString()
  };
}

function previewBuildFromRow(row: PreviewBuildRow): PreviewBuildRecord {
  return {
    id: row.id,
    generatedAppId: row.generatedAppId,
    buildType: "preview",
    status: "queued",
    createdAt: row.createdAt.toISOString()
  };
}

export function createWorkflowStore(settings: Settings): WorkflowStore {
  if (settings.dataStore === "postgres") {
    return new PostgresWorkflowStore(settings);
  }
  return workflowStore;
}

export const workflowStore = new InMemoryWorkflowStore();
