import type { AgentRun, Lead, SystemHealth } from "./types";

export const dashboardStats = [
  { label: "New leads", value: "23", note: "+12% this week", tone: "ok" },
  { label: "Qualified leads", value: "47", note: "+8% this week", tone: "ok" },
  { label: "Proposals waiting approval", value: "5", note: "human review", tone: "warn" },
  { label: "Preview apps generated", value: "12", note: "mock previews", tone: "ok" },
  { label: "Deployments waiting approval", value: "3", note: "production disabled", tone: "warn" },
  { label: "Active customers", value: "128", note: "sample account data", tone: "neutral" },
  { label: "Failed agent runs", value: "2", note: "needs retry", tone: "danger" },
  { label: "LLM gateway status", value: "Fake", note: "LLM_MODE=fake", tone: "ok" }
];

export const systemHealth: SystemHealth = {
  appEnv: "local",
  dataStore: "memory",
  llmMode: "fake",
  databaseConnectionKind: "supabase",
  databaseConfigured: true,
  supabaseConnectionKind: "local",
  outreachEnabled: false,
  productionDeployEnabled: false
};

export const leads: Lead[] = [
  {
    id: "lead-001",
    businessName: "Ljubljana Bike Rental",
    businessType: "Bike Rental",
    city: "Ljubljana",
    websiteStatus: "No booking",
    opportunityScore: 86,
    source: "OSM/licensed dataset",
    complianceStatus: "Allowed",
    recommendedPackage: "Rental Booking Plus",
    leadStatus: "Qualified"
  },
  {
    id: "lead-002",
    businessName: "Bistro Aurora",
    businessType: "Restaurant",
    city: "Ljubljana",
    websiteStatus: "Weak mobile site",
    opportunityScore: 78,
    source: "Licensed dataset",
    complianceStatus: "Allowed",
    recommendedPackage: "Reservation Plus",
    leadStatus: "New"
  },
  {
    id: "lead-003",
    businessName: "Urban Cuts",
    businessType: "Salon",
    city: "Maribor",
    websiteStatus: "Social only",
    opportunityScore: 82,
    source: "Manual import",
    complianceStatus: "Allowed",
    recommendedPackage: "Booking Plus",
    leadStatus: "Needs review"
  },
  {
    id: "lead-004",
    businessName: "Mountain View Hotel",
    businessType: "Hotel",
    city: "Bled",
    websiteStatus: "Outdated site",
    opportunityScore: 91,
    source: "Tourism registry",
    complianceStatus: "Allowed",
    recommendedPackage: "Reservation Booking",
    leadStatus: "Qualified"
  }
];

export const businessProfile = {
  id: "lead-001",
  name: "Ljubljana Bike Rental",
  type: "Bike Rental",
  city: "Ljubljana",
  address: "Slovenska cesta 58, 1000 Ljubljana",
  phone: "+386 1 234 5678",
  website: "www.ljubljanabikerental.si",
  source: "OSM/licensed dataset",
  sourceRecords: [
    "source_record: osm_extract_2026_04, license: ODbL, allowed_use: lead qualification",
    "source_record: manual_admin_note_001, license: internal, allowed_use: customer profile draft"
  ],
  websiteAudit: [
    "No online booking or availability calendar",
    "Static content with limited mobile ergonomics",
    "No pickup and return time management",
    "Missing structured data for rental services"
  ],
  digitalGaps: [
    "Customers cannot reserve bikes online",
    "No customer-provided catalog or verified inventory",
    "No automated confirmation workflow"
  ],
  cgp: [
    "Tourists and local weekend riders are likely high-intent segments.",
    "Rental Booking Plus is a good pattern fit because pickup and return times matter.",
    "A preview app can show catalog, availability, and inquiry flow with placeholders."
  ],
  missingData: [
    "Exact rental prices per bike type",
    "Seasonal opening hours",
    "Deposit policy and amounts",
    "Product photos",
    "Cancellation policy"
  ]
};

export const proposal = {
  id: "proposal-001",
  businessName: "Ljubljana Bike Rental",
  packageName: "Rental Booking Plus",
  setupPrice: "EUR 899",
  monthlyPrice: "EUR 49/month",
  proposalText:
    "Ljubljana Bike Rental appears to have a strong location and a clear rental use case, but the current digital experience does not support online booking. A template-based Rental Booking Plus preview could show a catalog, pickup and return flow, availability placeholders, and customer inquiry capture. All prices, inventory, photos, and policy terms remain placeholders until the business confirms them.",
  outreachMessage:
    "Hi, we prepared a preview concept for a bike rental booking flow. Outreach sending is disabled in this MVP, so this text is review-only.",
  warnings: ["Outreach sending is disabled in MVP", "Exact pricing is missing", "Deposit and cancellation terms must be supplied by the customer"]
};

export const appSpec = {
  id: "app-001",
  selectedBlueprint: "bike-rental",
  appPattern: "rental_booking",
  templateId: "rental-booking-basic-v1",
  previewUrl: "https://preview.localgrowth.invalid/ljubljana-bike-rental",
  pagesGenerated: ["Home", "Bike catalog", "Availability", "Booking request", "Contact"],
  qaChecklist: [
    "No invented prices",
    "No fake inventory availability",
    "Missing data rendered as placeholders",
    "Outreach disabled",
    "Production deployment disabled"
  ],
  config: {
    business_name: "Ljubljana Bike Rental",
    vertical_id: "bike-rental",
    app_pattern: "rental_booking",
    pricing: { status: "placeholder", value: null },
    inventory: { status: "placeholder", value: [] },
    approval_status: "needs_review"
  }
};

export const verticalDraft = {
  id: "bike-rental",
  name: "Bike Rental",
  appPattern: "rental_booking",
  approvalStatus: "draft",
  filesToCreate: [
    "examples/blueprints/bike-rental/blueprint.yaml",
    "examples/blueprints/bike-rental/input.schema.json",
    "examples/blueprints/bike-rental/app_config.example.json",
    "examples/blueprints/bike-rental/campaign_playbook.yaml",
    "examples/blueprints/bike-rental/qa_checklist.md"
  ],
  filesToModify: ["examples/blueprints/registry.yaml", "blueprint matching tests", "classifier synonym tests"],
  requiredTests: ["pnpm --dir apps/web lint", "make test-blueprints", "make test-agents"],
  forbiddenChanges: ["No backend changes for one-off tables", "No production activation", "No outreach sending", "No invented prices or policy terms"]
};

export const generatedCodexPrompt = `Scope: add a Bike Rental vertical module as a draft only.

Expected files:
- examples/blueprints/registry.yaml
- examples/blueprints/bike-rental/blueprint.yaml
- examples/blueprints/bike-rental/input.schema.json
- examples/blueprints/bike-rental/app_config.example.json
- examples/blueprints/bike-rental/campaign_playbook.yaml
- examples/blueprints/bike-rental/qa_checklist.md

Verification:
- make test-blueprints
- make test-agents
- make lint

Do not:
- invent prices, availability, reviews, insurance terms, or safety guarantees
- send outreach
- deploy or activate the vertical in production`;

export const agentRuns: AgentRun[] = [
  {
    id: "run-001",
    agentName: "BusinessProfilerAgent",
    relatedBusiness: "Ljubljana Bike Rental",
    modelAlias: "profiler",
    promptVersion: "v2.3",
    status: "completed",
    duration: "2.4s",
    createdAt: "2 min ago",
    approvalStatus: "needs_review",
    inputSummary: "Lead profile, licensed source records, website audit summary",
    output: {
      target_customers: ["tourists", "local weekend riders"],
      recommended_package: "Rental Booking Plus",
      missing_data: ["pricing", "opening_hours", "deposit_policy"]
    }
  },
  {
    id: "run-002",
    agentName: "ProposalAgent",
    relatedBusiness: "Bistro Aurora",
    modelAlias: "proposal_writer",
    promptVersion: "v1.8",
    status: "completed",
    duration: "3.1s",
    createdAt: "15 min ago",
    approvalStatus: "draft",
    inputSummary: "Restaurant CGP and reservation app package",
    output: { proposal_status: "ai_draft", package: "Reservation Plus" }
  },
  {
    id: "run-003",
    agentName: "WebsiteAuditAgent",
    relatedBusiness: "Coffee Corner",
    modelAlias: "judge",
    promptVersion: "v1.2",
    status: "failed",
    duration: "timeout",
    createdAt: "1 hour ago",
    approvalStatus: "failed",
    inputSummary: "Website URL health and mobile audit",
    error: "Request timeout: website unreachable after 30s"
  },
  {
    id: "run-004",
    agentName: "BlueprintMatcherAgent",
    relatedBusiness: "Urban Cuts",
    modelAlias: "classifier",
    promptVersion: "v3.1",
    status: "completed",
    duration: "1.8s",
    createdAt: "2 hours ago",
    approvalStatus: "approved",
    inputSummary: "Salon lead metadata and website status",
    output: { business_type: "Salon", matched_blueprint: "appointment_booking", confidence: 0.94 }
  }
];

export const modelAliases = [
  ["classifier", "Business type classification", "fake-classifier", "healthy"],
  ["extractor", "Licensed source field extraction", "fake-extractor", "healthy"],
  ["profiler", "Customer growth profile generation", "fake-profiler", "healthy"],
  ["proposal_writer", "Proposal draft writing", "fake-proposal-writer", "healthy"],
  ["content_writer", "Template content writing", "fake-content-writer", "healthy"],
  ["coder", "Template config generation only", "fake-coder", "healthy"],
  ["judge", "QA and validation", "fake-judge", "healthy"],
  ["embedding", "Blueprint semantic matching", "fake-embedding", "healthy"]
];
