export type TrustState =
  | "verified"
  | "ai_draft"
  | "placeholder"
  | "missing_data"
  | "needs_review"
  | "approved"
  | "rejected"
  | "failed"
  | "deployed"
  | "draft"
  | "blocked";

export type Lead = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  websiteStatus: string;
  opportunityScore: number;
  source: string;
  complianceStatus: "Allowed" | "Needs review" | "Blocked";
  recommendedPackage: string;
  leadStatus: "New" | "Qualified" | "Needs review";
};

export type AgentRun = {
  id: string;
  agentName: string;
  relatedBusiness: string;
  modelAlias: string;
  promptVersion: string;
  status: "completed" | "failed" | "running" | "needs_review";
  duration: string;
  createdAt: string;
  approvalStatus: TrustState;
  inputSummary: string;
  output?: Record<string, unknown>;
  error?: string;
};

export type SystemHealth = {
  appEnv: string;
  dataStore: "memory" | "postgres";
  llmMode: "fake" | "gateway";
  databaseConnectionKind: "unset" | "local" | "supabase" | "external" | "invalid";
  databaseConfigured: boolean;
  supabaseConnectionKind: "unset" | "local" | "supabase" | "external" | "invalid";
  outreachEnabled: boolean;
  productionDeployEnabled: boolean;
};
