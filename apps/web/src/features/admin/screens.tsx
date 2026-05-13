import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAgentRun,
  getBusinessProfile,
  getGeneratedApp,
  getGeneratedCodexPrompt,
  getProposal,
  getSystemHealth,
  getVerticalDraft,
  listAgentRuns,
  listDashboardStats,
  listGeneratedApps,
  listLeads,
  listModelAliases,
  listProposals
} from "../../lib/admin-api";
import type { AgentRun, TrustState } from "../../lib/types";
import { Pill, StatusBadge, TrustBadge } from "../../components/ui/badges";
import {
  ApprovalBar,
  ConfirmActionDialog,
  DataCard,
  EmptyState,
  JsonViewer,
  PageHeader,
  Timeline,
  WarningPanel
} from "../../components/ui/panels";
import { BusinessTypeWizardInteractive, LeadInboxInteractive, ProposalApprovalPanel } from "./interactive";

function runState(status: AgentRun["status"]): TrustState {
  if (status === "completed") return "approved";
  if (status === "failed") return "failed";
  if (status === "needs_review") return "needs_review";
  return "draft";
}

export async function DashboardScreen() {
  const [dashboardStats, leads, health] = await Promise.all([
    listDashboardStats(),
    listLeads(),
    getSystemHealth()
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        kicker="Approval and control surface for LocalGrowth AI mock workflows"
        actions={
          <>
            <Link className="button secondary" href="/leads">
              Review leads
            </Link>
            <Link className="button" href="/agent-runs">
              Agent runs
            </Link>
          </>
        }
      />

      <section className="grid cols-4">
        {dashboardStats.map((stat) => (
          <DataCard className="metric" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <Pill tone={stat.tone as "ok" | "warn" | "danger" | "neutral"}>{stat.note}</Pill>
          </DataCard>
        ))}
      </section>

      <section className="grid cols-2" style={{ marginTop: 16 }}>
        <DataCard title="Approval queue" description="Items that need a human decision before moving forward">
          <div className="stack">
            {[
              ["Ljubljana Bike Rental", "Proposal review", "needs_review"],
              ["Bistro Aurora", "Preview app QA", "needs_review"],
              ["Bike Rental vertical", "Codex handoff draft", "draft"]
            ].map(([name, detail, state]) => (
              <div className="split-row" key={name}>
                <div>
                  <strong>{name}</strong>
                  <p className="page-kicker">{detail}</p>
                </div>
                <StatusBadge state={state as TrustState} />
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="Recent activity" description="Audit-style mock events">
          <Timeline
            items={[
              { title: "Proposal draft generated", detail: "Ljubljana Bike Rental", meta: "2 min ago" },
              { title: "CGP marked AI draft", detail: "Bistro Aurora", meta: "15 min ago" },
              { title: "Agent run failed", detail: "Coffee Corner website audit", meta: "1 hour ago" },
              { title: "Blueprint matched", detail: "Urban Cuts to appointment_booking", meta: "2 hours ago" }
            ]}
          />
        </DataCard>
      </section>

      <section className="grid cols-2" style={{ marginTop: 16 }}>
        <DataCard title="Top opportunity leads" description="High-scoring mock leads">
          <div className="stack">
            {leads.slice(0, 3).map((lead) => (
              <div className="split-row" key={lead.id}>
                <div>
                  <strong>{lead.businessName}</strong>
                  <p className="page-kicker">
                    {lead.businessType}, {lead.city}, score {lead.opportunityScore}
                  </p>
                </div>
                <Link className="button secondary" href={`/leads/${lead.id}`}>
                  View profile
                </Link>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title="System health" description="Backend safety and storage mode">
          <table className="table">
            <caption>Current backend safety gates and data store mode</caption>
            <tbody>
              <tr>
                <td>LLM gateway</td>
                <td>
                  <Pill tone={health.llmMode === "fake" ? "ok" : "warn"}>{health.llmMode} mode</Pill>
                </td>
              </tr>
              <tr>
                <td>Data store</td>
                <td>
                  <Pill tone={health.dataStore === "postgres" ? "ok" : "warn"}>{health.dataStore}</Pill>
                </td>
              </tr>
              <tr>
                <td>Database target</td>
                <td>
                  <Pill tone={health.databaseConnectionKind === "supabase" ? "warn" : "ok"}>
                    {health.databaseConnectionKind}
                  </Pill>
                </td>
              </tr>
              <tr>
                <td>Outreach sending</td>
                <td>
                  <Pill tone={health.outreachEnabled ? "danger" : "warn"}>
                    {health.outreachEnabled ? "enabled" : "disabled"}
                  </Pill>
                </td>
              </tr>
              <tr>
                <td>Production deployment</td>
                <td>
                  <Pill tone={health.productionDeployEnabled ? "danger" : "warn"}>
                    {health.productionDeployEnabled ? "enabled" : "disabled"}
                  </Pill>
                </td>
              </tr>
            </tbody>
          </table>
        </DataCard>
      </section>
    </>
  );
}

export async function LeadsScreen() {
  const leads = await listLeads();

  return (
    <>
      <PageHeader title="Lead Inbox" kicker="Mock leads from manual or licensed sources only" />
      <LeadInboxInteractive initialLeads={leads} />
    </>
  );
}

export async function BusinessProfileScreen({ businessId }: { businessId?: string }) {
  const businessProfile = await getBusinessProfile(businessId);

  if (!businessProfile) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={businessProfile.name}
        kicker="Business Profile and Customer Growth Profile"
        actions={
          <>
            <Link className="button secondary" href="/leads">
              Back to leads
            </Link>
            <Link className="button" href="/proposals/proposal-001">
              Review proposal
            </Link>
          </>
        }
      />

      <section className="grid main-detail">
        <div className="stack">
          <DataCard title="Business details" description="Verified facts from compliant source records">
            <div className="fact-grid">
              {[
                ["Business name", businessProfile.name],
                ["Business type", businessProfile.type],
                ["City", businessProfile.city],
                ["Address", businessProfile.address],
                ["Phone", businessProfile.phone],
                ["Website", businessProfile.website],
                ["Source", businessProfile.source]
              ].map(([label, value]) => (
                <div className="fact" key={label}>
                  <strong>
                    {label} <TrustBadge state="verified" />
                  </strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard title="Source records" description="Source compliance must remain reviewable">
            <ul className="list">
              {businessProfile.sourceRecords.map((record) => (
                <li key={record}>
                  <code>{record}</code>
                  <TrustBadge state="verified" />
                </li>
              ))}
            </ul>
          </DataCard>

          <DataCard title="Website audit and digital gaps">
            <div className="grid cols-2">
              <div>
                <h3 className="section-title">Website audit</h3>
                <ul className="list">
                  {businessProfile.websiteAudit.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="section-title">Digital gaps</h3>
                <ul className="list">
                  {businessProfile.digitalGaps.map((item) => (
                    <li key={item}>
                      {item}
                      <TrustBadge state="ai_draft" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DataCard>

          <DataCard title="Customer Growth Profile" description="AI-generated output is labeled and reviewable">
            <WarningPanel title="AI draft" tone="info">
              These inferences are mock AI output and require admin review before use.
            </WarningPanel>
            <ul className="list" style={{ marginTop: 12 }}>
              {businessProfile.cgp.map((item) => (
                <li key={item}>
                  {item}
                  <TrustBadge state="ai_draft" />
                </li>
              ))}
            </ul>
          </DataCard>
        </div>

        <aside className="stack">
          <DataCard title="Recommended package">
            <h3>Rental Booking Plus</h3>
            <p className="page-kicker">Template-based rental booking app, no arbitrary generated code.</p>
            <ApprovalBar status={<TrustBadge state="needs_review" />}>
              <button className="button" type="button">
                Approve profile
              </button>
            </ApprovalBar>
          </DataCard>
          <DataCard title="Missing data">
            <WarningPanel title="Do not invent these facts" tone="danger">
              Unknown facts must stay placeholders until the customer or admin confirms them.
            </WarningPanel>
            <ul className="list" style={{ marginTop: 12 }}>
              {businessProfile.missingData.map((item) => (
                <li key={item}>
                  {item}
                  <TrustBadge state="missing_data" />
                </li>
              ))}
            </ul>
          </DataCard>
          <DataCard title="Admin notes">
            <EmptyState title="No notes yet" description="Notes remain local mock UI until an API is approved." />
          </DataCard>
        </aside>
      </section>
    </>
  );
}

export async function ProposalsListScreen() {
  const proposals = await listProposals();

  return (
    <>
      <PageHeader title="Proposals" kicker="Generated proposal drafts waiting for admin review" />
      <DataCard title="Proposal queue">
        <table className="table">
          <caption>Proposal drafts waiting for review</caption>
          <thead>
            <tr>
              <th scope="col">Proposal</th>
              <th scope="col">Business</th>
              <th scope="col">Package</th>
              <th scope="col">Status</th>
              <th scope="col">Risk</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td>{proposal.id}</td>
                <td>{proposal.businessName}</td>
                <td>{proposal.packageName}</td>
                <td>
                  <TrustBadge state="ai_draft" />
                </td>
                <td>
                  <TrustBadge state="missing_data" />
                </td>
                <td>
                  <Link className="button secondary" href={`/proposals/${proposal.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </>
  );
}

export async function ProposalReviewScreen({ proposalId }: { proposalId?: string }) {
  const proposal = await getProposal(proposalId);

  if (!proposal) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Proposal Review"
        kicker={`${proposal.businessName} - ${proposal.packageName}`}
        actions={<Link className="button secondary" href="/proposals">Back to proposals</Link>}
      />
      <WarningPanel title="Outreach disabled" tone="warn">
        Marketing messages cannot be sent automatically in this MVP. Admins may only review and copy approved text.
      </WarningPanel>
      <section className="grid main-detail" style={{ marginTop: 16 }}>
        <div className="stack">
          <DataCard title="Generated proposal text" description="Review AI draft before any customer-facing use">
            <TrustBadge state="ai_draft" />
            <p style={{ marginTop: 12 }}>{proposal.proposalText}</p>
          </DataCard>
          <DataCard title="Generated outreach message">
            <TrustBadge state="ai_draft" />
            <p>{proposal.outreachMessage}</p>
            <button className="button secondary" disabled type="button">
              Send outreach disabled
            </button>
          </DataCard>
          <DataCard title="Risk warnings">
            <ul className="list">
              {proposal.warnings.map((warning) => (
                <li key={warning}>
                  {warning}
                  <TrustBadge state="needs_review" />
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
        <aside className="stack">
          <DataCard title="Suggested package">
            <table className="table">
              <caption>Proposal package pricing summary</caption>
              <tbody>
                <tr>
                  <td>Package</td>
                  <td>{proposal.packageName}</td>
                </tr>
                <tr>
                  <td>Setup price</td>
                  <td>{proposal.setupPrice}</td>
                </tr>
                <tr>
                  <td>Monthly price</td>
                  <td>{proposal.monthlyPrice}</td>
                </tr>
              </tbody>
            </table>
          </DataCard>
          <ProposalApprovalPanel />
        </aside>
      </section>
    </>
  );
}

export async function AppsListScreen() {
  const apps = await listGeneratedApps();

  return (
    <>
      <PageHeader title="Generated Apps" kicker="Preview apps generated from approved templates and validated config" />
      <DataCard title="App previews">
        <table className="table">
          <caption>Generated preview apps and deployment state</caption>
          <thead>
            <tr>
              <th scope="col">App</th>
              <th scope="col">Blueprint</th>
              <th scope="col">Pattern</th>
              <th scope="col">QA</th>
              <th scope="col">Deployment</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((appSpec) => (
              <tr key={appSpec.id}>
                <td>{appSpec.id}</td>
                <td>{appSpec.selectedBlueprint}</td>
                <td>{appSpec.appPattern}</td>
                <td>
                  <TrustBadge state="needs_review" />
                </td>
                <td>
                  <TrustBadge state="blocked" />
                </td>
                <td>
                  <Link className="button secondary" href={`/apps/${appSpec.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </>
  );
}

export async function AppPreviewScreen({ appId }: { appId?: string }) {
  const appSpec = await getGeneratedApp(appId);

  if (!appSpec) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Generated App Preview" kicker="Template preview with placeholders and disabled production deployment" />
      <section className="grid main-detail">
        <div className="stack">
          <DataCard title="Preview">
            <div className="preview-frame">
              <div className="preview-top">
                <strong>Ljubljana Bike Rental</strong>
                <span>Preview only</span>
              </div>
              <div className="preview-body">
                <div className="preview-hero">
                  <h3>Bike rentals in Ljubljana</h3>
                  <p>Catalog, availability, prices, and policies are placeholders until confirmed.</p>
                </div>
                <div className="preview-card-row">
                  <div>City bikes</div>
                  <div>Availability placeholder</div>
                  <div>Booking request form</div>
                </div>
              </div>
            </div>
          </DataCard>
          <DataCard title="Generated app config">
            <JsonViewer value={appSpec.config} />
          </DataCard>
        </div>
        <aside className="stack">
          <DataCard title="Build metadata">
            <table className="table">
              <caption>Generated app template metadata</caption>
              <tbody>
                <tr>
                  <td>Selected blueprint</td>
                  <td>{appSpec.selectedBlueprint}</td>
                </tr>
                <tr>
                  <td>App pattern</td>
                  <td>{appSpec.appPattern}</td>
                </tr>
                <tr>
                  <td>Template ID</td>
                  <td>{appSpec.templateId}</td>
                </tr>
              </tbody>
            </table>
          </DataCard>
          <DataCard title="Pages generated">
            <ul className="list">
              {appSpec.pagesGenerated.map((page) => (
                <li key={page}>{page}</li>
              ))}
            </ul>
          </DataCard>
          <DataCard title="QA checklist">
            <ul className="list">
              {appSpec.qaChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DataCard>
          <DataCard title="Deployment panel">
            <WarningPanel title="Production deployment disabled" tone="danger">
              QA and approval must pass before production can be enabled.
            </WarningPanel>
            <button className="button" disabled style={{ marginTop: 10 }} type="button">
              Deploy production
            </button>
          </DataCard>
        </aside>
      </section>
    </>
  );
}

export function BusinessTypesScreen() {
  return (
    <>
      <PageHeader
        title="Business Types"
        kicker="Versioned vertical modules, not free-form prompting"
        actions={<Link className="button" href="/business-types/new">New business type</Link>}
      />
      <DataCard title="Configured verticals">
        <table className="table">
          <caption>Versioned business type modules</caption>
          <thead>
            <tr>
              <th scope="col">Vertical</th>
              <th scope="col">Pattern</th>
              <th scope="col">Status</th>
              <th scope="col">Handoff</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bike Rental</td>
              <td>rental_booking</td>
              <td>
                <TrustBadge state="draft" />
              </td>
              <td>
                <Link className="button secondary" href="/business-types/bike-rental">
                  Open
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </DataCard>
    </>
  );
}

export async function BusinessTypeWizardScreen() {
  const appSpec = await getGeneratedApp();

  if (!appSpec) {
    notFound();
  }

  return (
    <>
      <PageHeader title="New Business Type" kicker="Bike Rental example draft" />
      <BusinessTypeWizardInteractive qaChecklist={appSpec.qaChecklist} />
    </>
  );
}

export async function BusinessTypeDetailScreen({ verticalId }: { verticalId?: string }) {
  const verticalDraft = await getVerticalDraft(verticalId);

  if (!verticalDraft) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Bike Rental"
        kicker="Draft vertical module for rental_booking"
        actions={<Link className="button" href="/business-types/bike-rental/codex-handoff">Codex handoff</Link>}
      />
      <section className="grid cols-2">
        <DataCard title="Vertical draft summary">
          <table className="table">
            <caption>Bike Rental vertical draft metadata</caption>
            <tbody>
              <tr>
                <td>Name</td>
                <td>{verticalDraft.name}</td>
              </tr>
              <tr>
                <td>Vertical ID</td>
                <td>{verticalDraft.id}</td>
              </tr>
              <tr>
                <td>App pattern</td>
                <td>{verticalDraft.appPattern}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>
                  <TrustBadge state="draft" />
                </td>
              </tr>
            </tbody>
          </table>
        </DataCard>
        <DataCard title="Handoff policy">
          <WarningPanel title="Approval flow only" tone="warn">
            Codex may prepare files and tests, but admin activation happens after PR review and reindex.
          </WarningPanel>
        </DataCard>
      </section>
    </>
  );
}

export async function CodexHandoffScreen({ verticalId }: { verticalId?: string }) {
  const [verticalDraft, generatedCodexPrompt] = await Promise.all([getVerticalDraft(verticalId), getGeneratedCodexPrompt(verticalId)]);

  if (!verticalDraft || !generatedCodexPrompt) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Codex Handoff" kicker="Approved vertical implementation request draft" />
      <ApprovalBar status={<TrustBadge state="needs_review" />}>
        <button className="button" disabled type="button">
          Run Codex handoff disabled
        </button>
      </ApprovalBar>
      <section className="grid cols-2" style={{ marginTop: 16 }}>
        <DataCard title="Files Codex will create">
          <ul className="list">
            {verticalDraft.filesToCreate.map((file) => (
              <li key={file}>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </DataCard>
        <DataCard title="Files Codex may modify">
          <ul className="list">
            {verticalDraft.filesToModify.map((file) => (
              <li key={file}>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </DataCard>
        <DataCard title="Required tests">
          <ul className="list">
            {verticalDraft.requiredTests.map((test) => (
              <li key={test}>
                <code>{test}</code>
              </li>
            ))}
          </ul>
        </DataCard>
        <DataCard title="Forbidden changes">
          <ul className="list">
            {verticalDraft.forbiddenChanges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DataCard>
      </section>
      <DataCard title="Generated Codex prompt" style={{ marginTop: 16 }}>
        <pre className="code-panel">{generatedCodexPrompt}</pre>
      </DataCard>
    </>
  );
}

export async function AgentRunsScreen() {
  const agentRuns = await listAgentRuns();

  return (
    <>
      <PageHeader title="Agent Runs" kicker="Structured observability for AI and deterministic agent actions" />
      <DataCard title="All agent runs">
        <table className="table">
          <caption>Auditable mock agent run history</caption>
          <thead>
            <tr>
              <th scope="col">Agent name</th>
              <th scope="col">Related business</th>
              <th scope="col">Model alias</th>
              <th scope="col">Prompt version</th>
              <th scope="col">Status</th>
              <th scope="col">Duration</th>
              <th scope="col">Created at</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agentRuns.map((run) => (
              <tr key={run.id}>
                <td>{run.agentName}</td>
                <td>{run.relatedBusiness}</td>
                <td>
                  <code>{run.modelAlias}</code>
                </td>
                <td>{run.promptVersion}</td>
                <td>
                  <StatusBadge state={runState(run.status)}>{run.status}</StatusBadge>
                </td>
                <td>{run.duration}</td>
                <td>{run.createdAt}</td>
                <td>
                  <Link className="button secondary" href={`/agent-runs/${run.id}`}>
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </>
  );
}

export async function AgentRunDetailScreen({ runId }: { runId?: string }) {
  const run = await getAgentRun(runId);

  if (!run) {
    notFound();
  }

  return (
    <>
      <PageHeader title={run.agentName} kicker={`Run ID: ${run.id}`} actions={<Link className="button secondary" href="/agent-runs">Back</Link>} />
      <section className="grid main-detail">
        <div className="stack">
          <DataCard title="Input summary">
            <p>{run.inputSummary}</p>
          </DataCard>
          <DataCard title="Output JSON">
            <JsonViewer value={run.output ?? { status: "no_output" }} />
          </DataCard>
          <DataCard title="Errors">
            {run.error ? <WarningPanel title="Error" tone="danger">{run.error}</WarningPanel> : <EmptyState title="No errors" description="This mock run completed without recorded errors." />}
          </DataCard>
        </div>
        <aside className="stack">
          <DataCard title="Run metadata">
            <table className="table">
              <caption>Selected agent run metadata</caption>
              <tbody>
                <tr>
                  <td>Related business</td>
                  <td>{run.relatedBusiness}</td>
                </tr>
                <tr>
                  <td>Model alias</td>
                  <td>{run.modelAlias}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>
                    <StatusBadge state={runState(run.status)}>{run.status}</StatusBadge>
                  </td>
                </tr>
                <tr>
                  <td>Approval status</td>
                  <td>
                    <TrustBadge state={run.approvalStatus} />
                  </td>
                </tr>
              </tbody>
            </table>
          </DataCard>
          <ConfirmActionDialog title="Retry action" description="Retry stays in mock UI and does not call a real model." actionLabel="Retry run" />
        </aside>
      </section>
    </>
  );
}

export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" kicker="System configuration placeholders" />
      <DataCard title="Available settings">
        <div className="actions">
          <Link className="button secondary" href="/settings/llm-gateway">
            LLM Gateway
          </Link>
        </div>
      </DataCard>
    </>
  );
}

export async function LlmGatewayScreen() {
  const modelAliases = await listModelAliases();

  return (
    <>
      <PageHeader title="LLM Gateway Settings" kicker="Model aliases are shown without exposing gateway credentials" />
      <section className="grid cols-4">
        <DataCard className="metric">
          <span>Gateway status</span>
          <strong>Healthy</strong>
          <Pill tone="ok">mock</Pill>
        </DataCard>
        <DataCard className="metric">
          <span>Fake mode</span>
          <strong>Enabled</strong>
          <Pill tone="ok">LLM_MODE=fake</Pill>
        </DataCard>
        <DataCard className="metric">
          <span>Request logging</span>
          <strong>On</strong>
          <Pill tone="ok">auditable</Pill>
        </DataCard>
        <DataCard className="metric">
          <span>Gateway URL</span>
          <strong>Hidden</strong>
          <Pill tone="warn">env only</Pill>
        </DataCard>
      </section>
      <WarningPanel title="Credentials hidden" tone="info">
        Production credentials must remain in environment variables or secret stores, never source code.
      </WarningPanel>
      <DataCard title="Model aliases" description="Logical aliases keep model names out of workflow code">
        <table className="table">
          <caption>LLM gateway model aliases in fake mode</caption>
          <thead>
            <tr>
              <th scope="col">Alias</th>
              <th scope="col">Purpose</th>
              <th scope="col">Model</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {modelAliases.map(([alias, purpose, model, status]) => (
              <tr key={alias}>
                <td>
                  <code>{alias}</code>
                </td>
                <td>{purpose}</td>
                <td>{model}</td>
                <td>
                  <Pill tone="ok">{status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </>
  );
}

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} kicker={description} />
      <DataCard title="MVP placeholder">
        <EmptyState title={`${title} is not connected yet`} description="This route is prepared for the admin shell and uses mock UI only." />
      </DataCard>
    </>
  );
}
