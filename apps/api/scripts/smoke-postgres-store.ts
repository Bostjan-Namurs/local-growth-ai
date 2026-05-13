import { createApp } from "../src/app.js";
import { getSettings } from "../src/config.js";
import { createSqlClient } from "../src/db/index.js";

const marker = `codex-smoke-${Date.now()}`;
const app = createApp();

try {
  const created = await app.inject({
    method: "POST",
    url: "/businesses",
    payload: {
      name: `Codex DB Smoke ${marker}`,
      vertical: "bike_rental",
      metadata: { codex_smoke: marker }
    }
  });
  if (created.statusCode !== 201) {
    throw new Error(`business create failed: ${created.statusCode} ${created.body}`);
  }

  const business = created.json<{ id: string }>();
  const source = await app.inject({
    method: "POST",
    url: `/businesses/${business.id}/source-records`,
    payload: {
      sourceType: "manual_import",
      allowedUse: ["proposal"],
      metadata: { codex_smoke: marker }
    }
  });
  if (source.statusCode !== 201) {
    throw new Error(`source create failed: ${source.statusCode} ${source.body}`);
  }

  const websiteAudit = await app.inject({
    method: "POST",
    url: `/businesses/${business.id}/website-audits`,
    payload: {
      websiteUrl: "https://example.com",
      websiteFound: true,
      hasHttps: true,
      hasBooking: false,
      issues: ["codex smoke test audit"]
    }
  });
  if (websiteAudit.statusCode !== 201) {
    throw new Error(`website audit create failed: ${websiteAudit.statusCode} ${websiteAudit.body}`);
  }

  const websiteAudits = await app.inject({
    method: "GET",
    url: `/businesses/${business.id}/website-audits`
  });
  if (websiteAudits.json<{ website_audits: Array<{ id: string }> }>().website_audits.length !== 1) {
    throw new Error("created website audit was not listed");
  }

  const list = await app.inject({ method: "GET", url: "/businesses" });
  const listed = list.json<{ businesses: Array<{ id: string }> }>().businesses;
  if (!listed.some((record) => record.id === business.id)) {
    throw new Error("created business was not listed");
  }

  const approval = await app.inject({
    method: "POST",
    url: "/approvals",
    payload: {
      entityType: "proposal",
      entityId: marker,
      decision: "approved",
      notes: "Codex smoke test approval"
    }
  });
  if (approval.statusCode !== 201) {
    throw new Error(`approval create failed: ${approval.statusCode} ${approval.body}`);
  }

  const profile = await app.inject({
    method: "POST",
    url: `/businesses/${business.id}/business-profiles`
  });
  if (profile.statusCode !== 201) {
    throw new Error(`profile create failed: ${profile.statusCode} ${profile.body}`);
  }
  const profileRecord = profile.json<{ id: string; agentRunId: string }>();

  const profileAgentRun = await app.inject({
    method: "GET",
    url: `/agent-runs/${profileRecord.agentRunId}`
  });
  if (profileAgentRun.statusCode !== 200) {
    throw new Error(`agent run lookup failed: ${profileAgentRun.statusCode} ${profileAgentRun.body}`);
  }
  const profileRun = profileAgentRun.json<{ metadata: Record<string, unknown> }>();
  if (profileRun.metadata.business_name !== `Codex DB Smoke ${marker}`) {
    throw new Error("profile agent run metadata did not hydrate from Postgres");
  }

  const proposal = await app.inject({
    method: "POST",
    url: `/businesses/${business.id}/proposals`
  });
  if (proposal.statusCode !== 201) {
    throw new Error(`proposal create failed: ${proposal.statusCode} ${proposal.body}`);
  }

  const proposalApproval = await app.inject({
    method: "POST",
    url: "/approvals",
    payload: {
      entityType: "proposal",
      entityId: proposal.json<{ id: string }>().id,
      decision: "approved",
      notes: "Codex smoke test proposal approval"
    }
  });
  if (proposalApproval.statusCode !== 201) {
    throw new Error(`proposal approval failed: ${proposalApproval.statusCode} ${proposalApproval.body}`);
  }

  const generatedApp = await app.inject({
    method: "POST",
    url: `/businesses/${business.id}/proposals/${proposal.json<{ id: string }>().id}/app-spec`
  });
  if (generatedApp.statusCode !== 201) {
    throw new Error(`generated app create failed: ${generatedApp.statusCode} ${generatedApp.body}`);
  }

  const previewBuild = await app.inject({
    method: "POST",
    url: `/generated-apps/${generatedApp.json<{ id: string }>().id}/preview-builds`
  });
  if (previewBuild.statusCode !== 201) {
    throw new Error(`preview build create failed: ${previewBuild.statusCode} ${previewBuild.body}`);
  }

  const verticalDraft = await app.inject({
    method: "POST",
    url: "/vertical-drafts",
    payload: {
      verticalId: `codex_${marker.replaceAll("-", "_")}`,
      name: "Codex Smoke Vertical",
      appPattern: "rental_booking",
      templateId: "rental-booking-pwa",
      wizardPayload: { codex_smoke: marker }
    }
  });
  if (verticalDraft.statusCode !== 201) {
    throw new Error(`vertical draft create failed: ${verticalDraft.statusCode} ${verticalDraft.body}`);
  }

  const sql = createSqlClient(getSettings());
  const persistedAgentRuns = await sql<{ count: string }[]>`
    select count(*)::text as count
    from agent_runs
    where input_json->>'business_name' = ${`Codex DB Smoke ${marker}`}
       or input_json->>'proposal_id' = ${proposal.json<{ id: string }>().id}
  `;
  await sql.end();
  if (Number(persistedAgentRuns[0]?.count ?? 0) < 3) {
    throw new Error("expected profile, proposal, and app spec agent runs to persist");
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        data_store: "postgres",
        business_id: business.id,
        source_record_id: source.json<{ id: string }>().id,
        website_audit_id: websiteAudit.json<{ id: string }>().id,
        approval_id: approval.json<{ id: string }>().id,
        business_profile_id: profileRecord.id,
        business_profile_agent_run_id: profileRecord.agentRunId,
        proposal_id: proposal.json<{ id: string }>().id,
        generated_app_id: generatedApp.json<{ id: string }>().id,
        preview_build_id: previewBuild.json<{ id: string }>().id,
        vertical_draft_id: verticalDraft.json<{ id: string }>().id,
        persisted_agent_runs: Number(persistedAgentRuns[0]?.count ?? 0),
        cleanup_marker: marker
      },
      null,
      2
    )
  );
} finally {
  await app.close();
  const sql = createSqlClient(getSettings());
  try {
    await sql`delete from agent_runs where input_json->>'business_name' = ${`Codex DB Smoke ${marker}`}`;
    await sql`delete from agent_runs where input_json->>'proposal_id' in (select id::text from proposals where business_id in (select id from businesses where metadata->>'codex_smoke' = ${marker}))`;
    await sql`delete from vertical_drafts where wizard_payload->>'codex_smoke' = ${marker}`;
    await sql`delete from approvals where entity_id = ${marker}`;
    await sql`delete from approvals where notes = 'Codex smoke test proposal approval'`;
    await sql`delete from businesses where metadata->>'codex_smoke' = ${marker}`;
  } finally {
    await sql.end();
  }
}
