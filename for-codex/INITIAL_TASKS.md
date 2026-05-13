# Initial Codex Tasks

Give these tasks to Codex one by one. Each task should end with tests or a clear verification step.

## Task 1 — Bootstrap repo

Create the monorepo structure:

```text
apps/api
apps/web
apps/worker
blueprints
infra/k8s
migrations/drizzle
```

Add README, environment example, and basic test setup.

Acceptance:

- repo installs dependencies,
- test command runs,
- lint command exists.

## Task 2 — Database migration

Implement migration based on `examples/db/001_initial_schema.sql`.

Acceptance:

- migration applies against local Postgres/Supabase,
- pgvector extension is enabled,
- core tables exist.

## Task 3 — Backend health and config

Create API service with:

- `/health`,
- `/version`,
- environment config loader,
- database connection,
- structured logging.

Acceptance:

- health endpoint returns ok,
- app starts without database in local test mode,
- app connects to database in integration mode.

## Task 4 — Business/source API

Implement:

- create business,
- list businesses,
- get business,
- create source record,
- update compliance status.

Acceptance:

- source record is required for imported leads,
- compliance status appears on business detail.

## Task 5 — Approval API

Implement generic approvals:

- create approval,
- list approvals for entity,
- enforce approval checks helper.

Acceptance:

- approval writes audit log,
- deployment/proposal actions can call helper.

## Task 6 — LLM gateway client

Implement:

- OpenAI-compatible chat completion wrapper,
- model aliases,
- fake LLM mode,
- timeout/retry,
- request metadata logging.

Acceptance:

- fake mode returns deterministic proposal JSON,
- gateway mode can call configured URL.

## Task 7 — Agent protocol and run logger

Implement:

- `AgentProtocol`,
- `AgentContext`,
- `AgentResult`,
- `AgentRunLogger`,
- schema validation utilities.

Acceptance:

- every run creates an `agent_runs` record,
- failures are recorded.

## Task 8 — SourceComplianceAgent

Implement deterministic compliance rules first.

Acceptance:

- Google Maps scraping source returns rejected/restricted,
- manual import returns pending/approved based on config,
- unknown source returns pending_review.

## Task 9 — BusinessProfileAgent

Implement CGP generation.

Acceptance:

- uses business + audit + blueprint context,
- validates output schema,
- writes `customer_growth_profiles`,
- missing facts are preserved as `missing_data`.

## Task 10 — ProposalAgent

Implement proposal generation.

Acceptance:

- proposal generated only from existing CGP,
- proposal status is pending approval,
- no customer-visible send happens.

## Task 11 — Blueprint loader

Implement loader for Markdown/YAML blueprints.

Acceptance:

- restaurant and salon blueprints load,
- required inputs are extracted,
- active blueprint list endpoint works.

## Task 12 — AppSpecAgent

Implement app spec generation from approved proposal.

Acceptance:

- refuses unapproved proposal unless override in dev mode,
- generated spec validates against schema,
- creates `generated_apps` record.

## Task 13 — Preview build stub

Implement preview build record creation.

Acceptance:

- creates `app_builds` record,
- returns fake preview URL in dev mode,
- real build command can be added later.

## Task 14 — Admin UI skeleton

Create pages:

- lead inbox,
- business detail,
- CGP view,
- proposal view,
- approval button,
- app preview status.

Acceptance:

- pages load from API,
- approval button calls API.

## Task 15 — Rancher manifests

Create Helm/Kustomize or raw manifests based on examples.

Acceptance:

- API, worker, admin UI deploy to staging namespace,
- LLM gateway URL passed by secret/config,
- no public LLM ingress.
