# Codex Prompt — Implement LocalGrowth AI Admin UI Shell

Paste this into Codex from the repository root.

---

Read `AGENTS.md` first.

Then read:

- `docs/ui/ADMIN_UI_SCREEN_SPECS_STARTER.md`
- `docs/ui/ADMIN_UI_FIGMA_MAKE_PROMPT.md` if present
- `for-codex/IMPLEMENTATION_BRIEF.md` if present
- `for-codex/INITIAL_TASKS.md` if present

Do not implement the full product.

Implement the first **Admin UI shell** in `apps/web`.

## Goal

Create a static, production-oriented Admin UI foundation for LocalGrowth AI using mock data only.

The UI must support this product flow:

```text
Dashboard
→ Lead Inbox
→ Business Profile / CGP
→ Proposal Review
→ Generated App Preview
→ Business Type Wizard
→ Codex Handoff
→ Agent Runs
```

## Required stack

Use the current web app stack if already present.

Preferred stack:

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui-compatible component structure
```

Do not add a heavy state-management library.
Do not add backend changes.
Do not add auth yet.
Do not connect to production Supabase.
Do not connect to Rancher.
Do not connect to real LLMs.
Do not implement Google Maps scraping.
Do not implement outreach sending.
Do not deploy.

## Required routes

Create or prepare these routes:

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

If the project uses a different routing convention, adapt cleanly but keep equivalent pages.

## Required layout

Create an admin shell with:

```text
left sidebar
topbar
main content area
page header
status/approval area
```

Sidebar groups:

```text
Dashboard
Pipeline
  Leads
  Businesses
  Proposals
  Generated Apps
  Campaigns
Automation
  Agent Runs
  Approvals
  Deployments
Configuration
  Business Types
  Blueprints
  Templates
  LLM Gateway
  Data Sources
System
  Settings
  Audit Logs
```

For MVP, it is acceptable if some nav items route to placeholder pages.

## Required reusable components

Create reusable components where appropriate:

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

Keep components simple and readable. Avoid overengineering.

## Required screens

### 1. Dashboard

Show cards:

```text
New leads
Qualified leads
Proposals waiting approval
Preview apps generated
Deployments waiting approval
Active customers
Failed agent runs
LLM gateway status
```

Also include:

```text
Recent activity
Approval queue
System health
Top opportunity leads
```

### 2. Lead Inbox

Create a table with mock data.

Columns:

```text
Business name
Business type
City
Website status
Opportunity score
Source
Compliance status
Recommended package
Lead status
Actions
```

Include filters:

```text
business type
city
opportunity score
compliance status
website status
```

### 3. Business Profile / CGP

Show sections:

```text
Business details
Source records
Website audit
Digital gaps
Customer Growth Profile
Recommended package
Missing data
Admin notes
```

Clearly separate:

```text
Verified facts
AI inferences
Missing data
Placeholders
```

### 4. Proposal Review

Show:

```text
Generated proposal text
Suggested package
Setup price
Monthly price
Generated outreach message
Missing customer data
Risk warnings
Approval panel
```

Actions:

```text
Approve proposal
Request regeneration
Edit manually
Reject proposal
Generate preview app
```

Show a warning that outreach sending is disabled in MVP.

### 5. Generated App Preview

Show:

```text
Selected blueprint
App pattern
Template ID
Generated app config
Pages generated
QA checklist
Missing placeholders
Preview URL panel
Deployment panel
```

### 6. Business Type Wizard

Create a multi-step UI for adding a new business type.

Steps:

```text
Business type basics
App pattern selection
Required features
Required customer inputs
AI rules
Campaign playbook
QA checklist
Codex handoff
```

Use Bike Rental as the default example.

### 7. Codex Handoff

Show:

```text
Vertical draft summary
Files Codex will create
Files Codex may modify
Required tests
Forbidden changes
Generated Codex prompt
Approval status
```

The generated Codex prompt should be visible in a code-style panel.

### 8. Agent Runs

Show:

```text
Agent name
Related business
Model alias
Prompt version
Status
Duration
Created at
Actions
```

Create a detail page or drawer with:

```text
input summary
output JSON
errors
approval status
retry action
```

### 9. Settings / LLM Gateway

Show model aliases:

```text
classifier
extractor
profiler
proposal_writer
content_writer
coder
judge
embedding
```

Show fake mode enabled and hidden gateway settings.

## Mock data requirements

Use mock data for:

```text
bike rental lead
restaurant lead
salon lead
business profile
proposal
app spec
agent runs
LLM aliases
vertical draft
```

Example bike rental lead:

```text
Ljubljana Bike Rental
Business type: Bike Rental
City: Ljubljana
Website status: No booking
Opportunity score: 86
Source: OSM/licensed dataset
Compliance status: Allowed
Recommended package: Rental Booking Plus
Lead status: Qualified
```

## Trust/status badges

Implement badges for:

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
blocked
```

Use semantic visual differences, but do not hardcode excessive theme complexity.

## UX rules

- AI-generated text must be labeled `AI draft`.
- Unknown business facts must be labeled `Placeholder` or `Missing data`.
- Risky actions must require confirmation or be disabled.
- Production deployment must appear disabled until QA and approval pass.
- Outreach sending must be disabled in MVP.
- Codex handoff must be an approval flow, not automatic production activation.

## Code organization

Prefer this structure:

```text
apps/web/src/app/(admin)/layout.tsx
apps/web/src/app/(admin)/dashboard/page.tsx
apps/web/src/app/(admin)/leads/page.tsx
apps/web/src/app/(admin)/leads/[businessId]/page.tsx
apps/web/src/app/(admin)/proposals/page.tsx
apps/web/src/app/(admin)/proposals/[proposalId]/page.tsx
apps/web/src/app/(admin)/apps/page.tsx
apps/web/src/app/(admin)/apps/[appId]/page.tsx
apps/web/src/app/(admin)/business-types/page.tsx
apps/web/src/app/(admin)/business-types/new/page.tsx
apps/web/src/app/(admin)/business-types/[verticalId]/page.tsx
apps/web/src/app/(admin)/business-types/[verticalId]/codex-handoff/page.tsx
apps/web/src/app/(admin)/agent-runs/page.tsx
apps/web/src/app/(admin)/agent-runs/[runId]/page.tsx
apps/web/src/app/(admin)/settings/page.tsx
apps/web/src/app/(admin)/settings/llm-gateway/page.tsx
apps/web/src/components/layout/*
apps/web/src/components/ui/*
apps/web/src/features/*
apps/web/src/lib/mock-data.ts
apps/web/src/lib/types.ts
```

If the existing app structure is different, adapt while preserving clarity.

## Validation

Before finishing:

1. Run the available web lint/build/test commands.
2. If commands do not exist, add reasonable scripts or document what is missing.
3. Do not leave TypeScript errors.
4. Summarize changed files.
5. Summarize what remains mocked.

## Required process

Before editing, provide a short implementation plan.

After editing, provide:

```text
Files changed
Commands run
Results
Known limitations
Next recommended task
```
