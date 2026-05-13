import {
  agentRuns,
  appSpec,
  businessProfile,
  dashboardStats,
  generatedCodexPrompt,
  leads,
  modelAliases,
  proposal,
  systemHealth,
  verticalDraft
} from "./mock-data";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function listDashboardStats() {
  return clone(dashboardStats);
}

export async function getSystemHealth() {
  return clone(systemHealth);
}

export async function listLeads() {
  return clone(leads);
}

export async function getBusinessProfile(businessId = businessProfile.id) {
  const lead = leads.find((item) => item.id === businessId);

  if (!lead) {
    return undefined;
  }

  if (businessId === businessProfile.id) {
    return clone(businessProfile);
  }

  return clone({
    id: lead.id,
    name: lead.businessName,
    type: lead.businessType,
    city: lead.city,
    address: "Missing data",
    phone: "Missing data",
    website: lead.websiteStatus,
    source: lead.source,
    sourceRecords: [`source_record: ${lead.source}, license: stored metadata, allowed_use: lead qualification`],
    websiteAudit: [`Website status: ${lead.websiteStatus}`, "Detailed audit has not been run for this mock record"],
    digitalGaps: [`Recommended package: ${lead.recommendedPackage}`, "Customer-provided details are still required"],
    cgp: [
      `${lead.businessType} appears to fit the ${lead.recommendedPackage} package based on mock lead metadata.`,
      "This profile is a draft derived from the lead inbox record and requires admin review."
    ],
    missingData: ["Verified address", "Phone number", "Website URL", "Pricing", "Opening hours", "Policies"]
  });
}

export async function listProposals() {
  return clone([proposal]);
}

export async function getProposal(proposalId = proposal.id) {
  return proposalId === proposal.id ? clone(proposal) : undefined;
}

export async function listGeneratedApps() {
  return clone([appSpec]);
}

export async function getGeneratedApp(appId = appSpec.id) {
  return appId === appSpec.id ? clone(appSpec) : undefined;
}

export async function getVerticalDraft(verticalId = verticalDraft.id) {
  return verticalId === verticalDraft.id ? clone(verticalDraft) : undefined;
}

export async function getGeneratedCodexPrompt(verticalId = verticalDraft.id) {
  return verticalId === verticalDraft.id ? generatedCodexPrompt : undefined;
}

export async function listAgentRuns() {
  return clone(agentRuns);
}

export async function getAgentRun(runId = agentRuns[0].id) {
  const run = agentRuns.find((item) => item.id === runId);
  return run ? clone(run) : undefined;
}

export async function listModelAliases() {
  return clone(modelAliases);
}
