import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import { AppSpecAgent } from "./agents/app-spec.js";
import { BusinessProfileAgent } from "./agents/business-profile.js";
import { ProposalAgent } from "./agents/proposal.js";
import { createAgentRunLogger } from "./agents/run-logger.js";
import { SourceComplianceAgent } from "./agents/source-compliance.js";
import {
  databaseConfigured,
  databaseConnectionKind,
  databaseIsLocal,
  getSettings,
  supabaseConfigured,
  supabaseConnectionKind,
  supabaseIsLocal,
  type Settings
} from "./config.js";
import { checkDatabaseConnection } from "./db/index.js";
import { createApprovalSchema, createApprovalStore } from "./services/approvals.js";
import { BlueprintError, BlueprintRegistry } from "./services/blueprints.js";
import {
  businessInputSchema,
  createBusinessStore,
  sourceRecordInputSchema,
  websiteAuditInputSchema
} from "./services/businesses.js";
import { createVerticalDraftStore, verticalDraftInputSchema } from "./services/vertical-drafts.js";
import { createWorkerJobService, enqueueWorkerJobSchema } from "./services/worker-jobs.js";
import { createWorkflowStore } from "./services/workflow-records.js";

const sourceComplianceRunSchema = z.object({
  intendedUse: z.enum(["lead_generation", "proposal", "customer_app", "marketing"]),
  rawDataCategories: z.array(z.string()).default([])
});

export function createApp(settingsOverride?: Settings) {
  const settings = settingsOverride ?? getSettings();
  const app = Fastify({ logger: false });
  const businesses = createBusinessStore(settings);
  const approvals = createApprovalStore(settings);
  const workflow = createWorkflowStore(settings);
  const agentRuns = createAgentRunLogger(settings);
  const verticalDrafts = createVerticalDraftStore(settings);
  const workerJobs = createWorkerJobService(agentRuns, settings);

  app.addHook("onClose", async () => {
    if ("close" in businesses && typeof businesses.close === "function") {
      await businesses.close();
    }
    if ("close" in approvals && typeof approvals.close === "function") {
      await approvals.close();
    }
    if ("close" in workflow && typeof workflow.close === "function") {
      await workflow.close();
    }
    if ("close" in agentRuns && typeof agentRuns.close === "function") {
      await agentRuns.close();
    }
    if ("close" in verticalDrafts && typeof verticalDrafts.close === "function") {
      await verticalDrafts.close();
    }
  });

  void app.register(cors, {
    origin: settings.corsOrigins.split(",").map((origin) => origin.trim())
  });

  app.get("/health", async () => ({
    status: "ok",
    app_env: settings.appEnv,
    data_store: settings.dataStore,
    llm_mode: settings.llmMode,
    database_configured: databaseConfigured(settings),
    database_local: databaseIsLocal(settings),
    database_connection_kind: databaseConnectionKind(settings),
    supabase_configured: supabaseConfigured(settings),
    supabase_local: supabaseIsLocal(settings),
    supabase_connection_kind: supabaseConnectionKind(settings)
  }));

  app.get("/health/database", async () => checkDatabaseConnection(settings));

  app.get("/version", async () => ({
    app_name: settings.appName,
    app_version: settings.appVersion
  }));

  app.get("/blueprints", async (_request, reply) => {
    try {
      const registry = new BlueprintRegistry();
      return { verticals: registry.listVerticals() };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown blueprint error";
      return reply.status(500).send({ detail: message });
    }
  });

  app.get("/businesses", async () => ({
    businesses: await businesses.listBusinesses()
  }));

  app.post("/businesses", async (request, reply) => {
    const parsed = businessInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ detail: parsed.error.message });
    }
    return reply.status(201).send(await businesses.createBusiness(parsed.data));
  });

  app.get<{ Params: { businessId: string } }>(
    "/businesses/:businessId/source-records",
    async (request, reply) => {
      try {
        await businesses.getBusiness(request.params.businessId);
        return {
          source_records: await businesses.listSourceRecords(request.params.businessId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown business error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string } }>(
    "/businesses/:businessId/source-records",
    async (request, reply) => {
      const parsed = sourceRecordInputSchema.safeParse({
        ...(request.body as Record<string, unknown>),
        businessId: request.params.businessId
      });
      if (!parsed.success) {
        return reply.status(400).send({ detail: parsed.error.message });
      }
      try {
        return reply.status(201).send(await businesses.createSourceRecord(parsed.data));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown business error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string; sourceRecordId: string } }>(
    "/businesses/:businessId/source-records/:sourceRecordId/compliance",
    async (request, reply) => {
      const parsed = sourceComplianceRunSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ detail: parsed.error.message });
      }

      try {
        const sourceRecord = await businesses.getSourceRecord(
          request.params.businessId,
          request.params.sourceRecordId
        );
        const result = await new SourceComplianceAgent(agentRuns).run({
          sourceType: sourceRecord.sourceType,
          sourceUrl: sourceRecord.sourceUrl,
          rawDataCategories: parsed.data.rawDataCategories,
          intendedUse: parsed.data.intendedUse
        });
        const updatedSourceRecord = await businesses.updateSourceRecordCompliance({
          businessId: request.params.businessId,
          sourceRecordId: request.params.sourceRecordId,
          complianceStatus: result.output.allowed ? "approved" : "restricted",
          allowedUse: result.output.allowedUse,
          disallowedUse: result.output.disallowedUse,
          attributionRequired: result.output.requiresAttribution,
          retentionDays: result.output.retentionDays,
          metadata: {
            compliance_notes: result.output.notes,
            compliance_risk_level: result.output.riskLevel,
            agent_run_id: result.run.id
          }
        });

        return {
          source_record: updatedSourceRecord,
          compliance: result.output,
          agent_run: result.run
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown source compliance error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get<{ Params: { businessId: string } }>(
    "/businesses/:businessId/website-audits",
    async (request, reply) => {
      try {
        await businesses.getBusiness(request.params.businessId);
        return {
          website_audits: await businesses.listWebsiteAudits(request.params.businessId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown business error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string } }>(
    "/businesses/:businessId/website-audits",
    async (request, reply) => {
      const parsed = websiteAuditInputSchema.safeParse({
        ...(request.body as Record<string, unknown>),
        businessId: request.params.businessId
      });
      if (!parsed.success) {
        return reply.status(400).send({ detail: parsed.error.message });
      }
      try {
        return reply.status(201).send(await businesses.createWebsiteAudit(parsed.data));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown business error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get<{ Params: { businessId: string } }>(
    "/businesses/:businessId/business-profiles",
    async (request, reply) => {
      try {
        await businesses.getBusiness(request.params.businessId);
        return {
          business_profiles: await workflow.listBusinessProfiles(request.params.businessId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown profile error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string } }>(
    "/businesses/:businessId/business-profiles",
    async (request, reply) => {
      try {
        const business = await businesses.getBusiness(request.params.businessId);
        const websiteAudit = (await businesses.listWebsiteAudits(request.params.businessId)).at(-1);
        const sourceRecords = (await businesses.listSourceRecords(request.params.businessId)).filter(
          (record) => record.complianceStatus === "approved"
        );
        const result = await new BusinessProfileAgent(agentRuns, settings).run({
          business: {
            id: business.id,
            name: business.name,
            category: business.category,
            vertical: business.vertical,
            websiteUrl: business.websiteUrl
          },
          websiteAudit: websiteAudit
            ? {
                websiteFound: websiteAudit.websiteFound,
                hasHttps: websiteAudit.hasHttps,
                hasMobileLayout: websiteAudit.hasMobileLayout,
                hasBooking: websiteAudit.hasBooking,
                hasMenuOrServices: websiteAudit.hasMenuOrServices,
                hasClearCta: websiteAudit.hasClearCta,
                seoScore: websiteAudit.seoScore,
                performanceScore: websiteAudit.performanceScore,
                issues: websiteAudit.issues
              }
            : undefined,
          sourceRecordIds: sourceRecords.map((record) => record.id)
        });
        return reply.status(201).send(
          await workflow.createBusinessProfile({
            businessId: request.params.businessId,
            agentRunId: result.run.id,
            output: result.output
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown profile error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get<{ Params: { businessId: string } }>(
    "/businesses/:businessId/proposals",
    async (request, reply) => {
      try {
        await businesses.getBusiness(request.params.businessId);
        return {
          proposals: await workflow.listProposals(request.params.businessId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown proposal error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string } }>(
    "/businesses/:businessId/proposals",
    async (request, reply) => {
      try {
        const business = await businesses.getBusiness(request.params.businessId);
        const profile = await workflow.latestBusinessProfile(request.params.businessId);
        const result = await new ProposalAgent(agentRuns, settings).run({
          businessName: business.name,
          vertical: profile.output.vertical,
          recommendedPackage: profile.output.recommendedPackage,
          digitalGaps: profile.output.digitalGaps,
          missingData: profile.output.missingData,
          claims: profile.output.claims
        });
        return reply.status(201).send(
          await workflow.createProposal({
            businessId: request.params.businessId,
            businessProfileId: profile.id,
            agentRunId: result.run.id,
            output: result.output
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown proposal error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get<{ Params: { businessId: string } }>(
    "/businesses/:businessId/generated-apps",
    async (request, reply) => {
      try {
        await businesses.getBusiness(request.params.businessId);
        return {
          generated_apps: await workflow.listGeneratedApps(request.params.businessId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown generated app error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { businessId: string; proposalId: string } }>(
    "/businesses/:businessId/proposals/:proposalId/app-spec",
    async (request, reply) => {
      try {
        const business = await businesses.getBusiness(request.params.businessId);
        const proposal = await workflow.getProposal(
          request.params.businessId,
          request.params.proposalId
        );
        if (!(await approvals.hasApproved("proposal", proposal.id))) {
          return reply.status(409).send({
            detail: "Proposal must be approved before app spec generation"
          });
        }
        const result = await new AppSpecAgent(agentRuns).run({
          businessName: business.name,
          vertical: proposal.output.vertical,
          recommendedPackage: proposal.output.recommendedPackage,
          proposalId: proposal.id,
          missingData: proposal.output.missingData
        });
        return reply.status(201).send(
          await workflow.createGeneratedApp({
            businessId: request.params.businessId,
            proposalId: proposal.id,
            agentRunId: result.run.id,
            appSpec: result.output
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown app spec error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get<{ Params: { generatedAppId: string } }>(
    "/generated-apps/:generatedAppId/preview-builds",
    async (request, reply) => {
      try {
        await workflow.getGeneratedApp(request.params.generatedAppId);
        return {
          preview_builds: await workflow.listPreviewBuilds(request.params.generatedAppId)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown preview build error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.post<{ Params: { generatedAppId: string } }>(
    "/generated-apps/:generatedAppId/preview-builds",
    async (request, reply) => {
      try {
        return reply
          .status(201)
          .send(await workflow.createPreviewBuild(request.params.generatedAppId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown preview build error";
        return reply.status(404).send({ detail: message });
      }
    }
  );

  app.get("/approvals", async () => ({
    approvals: await approvals.list()
  }));

  app.get("/agent-runs", async () => ({
    agent_runs: await agentRuns.list()
  }));

  app.get<{ Params: { runId: string } }>("/agent-runs/:runId", async (request, reply) => {
    try {
      return await agentRuns.get(request.params.runId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown agent run error";
      return reply.status(404).send({ detail: message });
    }
  });

  app.post("/internal/worker-jobs", async (request, reply) => {
    if (!settings.internalApiToken || request.headers["x-internal-api-token"] !== settings.internalApiToken) {
      return reply.status(404).send({ detail: "Not found" });
    }

    const parsed = enqueueWorkerJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ detail: parsed.error.issues[0]?.message ?? parsed.error.message });
    }

    return reply.status(201).send(await workerJobs.enqueue(parsed.data));
  });

  app.post("/approvals", async (request, reply) => {
    const parsed = createApprovalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ detail: parsed.error.message });
    }
    return reply.status(201).send(await approvals.create(parsed.data));
  });

  app.get("/vertical-drafts", async () => ({
    vertical_drafts: await verticalDrafts.list()
  }));

  app.post("/vertical-drafts", async (request, reply) => {
    const parsed = verticalDraftInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ detail: parsed.error.message });
    }
    return reply.status(201).send(await verticalDrafts.create(parsed.data));
  });

  app.get<{ Params: { verticalId: string } }>("/blueprints/:verticalId", async (request, reply) => {
    try {
      const registry = new BlueprintRegistry();
      return registry.loadBlueprint(request.params.verticalId);
    } catch (error) {
      if (error instanceof BlueprintError) {
        return reply.status(404).send({ detail: error.message });
      }
      const message = error instanceof Error ? error.message : "Unknown blueprint error";
      return reply.status(500).send({ detail: message });
    }
  });

  return app;
}
