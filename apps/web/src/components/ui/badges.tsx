import type { TrustState } from "../../lib/types";

const labels: Record<TrustState, string> = {
  verified: "Verified",
  ai_draft: "AI draft",
  placeholder: "Placeholder",
  missing_data: "Missing data",
  needs_review: "Needs review",
  approved: "Approved",
  rejected: "Rejected",
  failed: "Failed",
  deployed: "Deployed",
  draft: "Draft",
  blocked: "Blocked"
};

const toneByState: Record<TrustState, string> = {
  verified: "ok",
  ai_draft: "info",
  placeholder: "warn",
  missing_data: "warn",
  needs_review: "warn",
  approved: "ok",
  rejected: "danger",
  failed: "danger",
  deployed: "ok",
  draft: "neutral",
  blocked: "danger"
};

export function StatusBadge({ state, children }: { state: TrustState; children?: React.ReactNode }) {
  return <span className={`badge ${toneByState[state]}`}>{children ?? labels[state]}</span>;
}

export function TrustBadge({ state }: { state: TrustState }) {
  return <StatusBadge state={state} />;
}

export function Pill({ tone = "neutral", children }: { tone?: "ok" | "warn" | "danger" | "info" | "neutral"; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
