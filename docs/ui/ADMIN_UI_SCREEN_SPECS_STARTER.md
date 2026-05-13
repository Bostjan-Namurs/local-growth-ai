# Admin UI Screen Specs Starter

Copy this file into `docs/ui/ADMIN_UI_SCREEN_SPECS_STARTER.md`.

## UI principle

The Admin UI is an approval and control surface. AI-generated outputs must always be labeled and reviewable.

## Routes for MVP

```text
/dashboard
/leads
/leads/[businessId]
/proposals
/proposals/[proposalId]
/apps
/apps/[appId]
/business-types
/business-types/new
/business-types/[verticalId]
/business-types/[verticalId]/codex-handoff
/agent-runs
/agent-runs/[runId]
/settings
/settings/llm-gateway
```

## Shared components

```text
AdminShell
Sidebar
Topbar
PageHeader
DataCard
StatusBadge
TrustBadge
ApprovalBar
EmptyState
LoadingSkeleton
WarningPanel
JsonViewer
Timeline
ConfirmActionDialog
```

## Trust states

```text
verified
ai_draft
placeholder
needs_review
approved
rejected
failed
deployed
draft
```

## MVP data mode

First implementation uses mock data only. Do not connect real API until the UI shell is approved.

## Permission rule

Dangerous actions must show disabled state or confirmation:

```text
send_outreach
deploy_production
activate_vertical
run_codex_handoff
start_campaign
change_pricing
```
