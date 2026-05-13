# AGENTS.md — Repository Instructions for Codex / Coding Agents

This project is a self-hosted AI platform for discovering local businesses, generating proposals, generating template-based websites/apps, and deploying approved apps.

## Non-negotiable rules

1. **Do not implement scraping of Google Maps.** Lead source integrations must pass through `SourceComplianceAgent` and must store `source_records` with license/allowed-use metadata.
2. **Do not send marketing messages automatically.** Campaign sending requires approval and a stored suppression/opt-out check.
3. **Do not generate arbitrary production code from LLM output.** Customer apps must be generated from approved templates and validated config/content files.
4. **Do not expose local LLM services publicly.** LLM endpoints must be cluster-internal unless explicitly configured behind authentication.
5. **Do not store secrets in source code.** Use Kubernetes secrets, sealed secrets, external secret stores, or environment variables.
6. **Do not invent business facts.** Unknown customer facts must be stored as `missing_data` or rendered as placeholders.
7. **All writes from agents must be auditable.** Agent runs must write structured logs, input hashes, output hashes, model alias, and approval status.

## Implementation style

- Prefer small, testable modules.
- Prefer deterministic workflow code over open-ended agent autonomy.
- Every agent must have:
  - typed input model,
  - typed output model,
  - prompt template or deterministic tool code,
  - validation step,
  - failure mode,
  - audit log event.
- Use generated migrations for database changes.
- Keep business logic server-side.
- Keep LLM model names behind aliases, for example `classifier`, `extractor`, `writer`, `coder`, `judge`, `embedding`.

## Suggested first stack

```text
backend: Node.js + TypeScript + Fastify + Zod
worker: BullMQ + Redis
frontend: Next.js admin dashboard
storage: Supabase Postgres + pgvector + object storage
llm gateway: LiteLLM or custom OpenAI-compatible router
llm serving: vLLM for GPU models, Ollama for dev/small models
orchestration: deterministic state machine first; LangGraph later if needed
```

## Testing expectations

- Unit tests for every agent validation function.
- Contract tests for LLM gateway adapter.
- Migration tests against local Postgres with pgvector.
- No agent output should be trusted until schema validation passes.
- Generated customer app config must pass JSON Schema validation before preview deployment.

## First files to read

1. `for-codex/IMPLEMENTATION_BRIEF.md`
2. `for-codex/INITIAL_TASKS.md`
3. `docs/02-technical-architecture.md`
4. `docs/04-agent-system-codex-implementation.md`
5. `examples/db/001_initial_schema.sql`


## Business type / vertical onboarding rules

A business type is not added by free-form prompting. It must be added as a versioned vertical module.

When adding a new business type:

1. Decide whether it is only a new customer using an existing vertical or a new vertical that requires repository changes.
2. Reuse an existing app pattern whenever possible, for example `rental_booking`, `appointment_booking`, `reservation_booking`, `service_quote`, or `direct_booking`.
3. Add or update `examples/blueprints/registry.yaml`.
4. Add `examples/blueprints/<vertical-id>/blueprint.yaml`.
5. Add `examples/blueprints/<vertical-id>/input.schema.json`.
6. Add `examples/blueprints/<vertical-id>/app_config.example.json`.
7. Add `examples/blueprints/<vertical-id>/campaign_playbook.yaml`.
8. Add `examples/blueprints/<vertical-id>/qa_checklist.md`.
9. Add classifier synonyms and blueprint-matching tests.
10. Add template support only if existing templates cannot support the vertical.
11. Add database migrations only for reusable modules, not one-off vertical tables unless unavoidable.
12. Add tests for blueprint loading, schema validation, app config validation, agent mapping, and QA rules.
13. Run lint and tests before reporting completion.

Never invent prices, legal terms, insurance terms, customer reviews, exact inventory availability, certifications, partnerships, or safety guarantees. Unknown facts must remain placeholders until confirmed by the customer or admin.

## Codex handoff rules

Codex may prepare repository changes for a new vertical, but it must not directly activate the vertical in production. The correct handoff is:

```text
admin UI draft
  -> approved vertical implementation request
  -> Codex branch/workspace
  -> generated files + tests
  -> CI
  -> pull request
  -> human review
  -> merge
  -> blueprint reindex into pgvector
  -> admin activates vertical
```

A Codex task must include scope, expected files, verification commands, acceptance criteria, and do-not rules. If the task requires legal, pricing, insurance, safety, or regulatory content, Codex must create placeholders and mark the task for human review.


## Pre-coding implementation lock

Before coding, read:

1. `docs/12-pre-coding-decision-lock.md`
2. `docs/13-local-dev-bootstrap.md`
3. `docs/14-codex-first-sprint-operating-model.md`

Use fake LLM mode for initial tests. Do not require real local models, vLLM, Ollama, or LiteLLM for Sprint 1.

## Required initial verification commands

The repository should converge toward these root-level commands:

```bash
make dev-up
make test
make test-api
make test-blueprints
make test-agents
make lint
```

If a command cannot yet run because the scaffold is incomplete, create the command and document what remains missing. Do not silently skip checks in final implementation tasks.

## Sprint 1 scope

Sprint 1 is limited to repository scaffold, local dev setup, health endpoint, config loading, fake LLM client skeleton, blueprint loader skeleton, and tests. Do not implement full lead discovery, automatic outreach, automatic deployment, payment flows, or production agent autonomy in Sprint 1.

## Locked MVP implementation choices

Use these defaults unless the repository already contains an explicit alternative:

```text
backend: Node.js + TypeScript + Fastify + Zod + Drizzle
package manager: pnpm
worker: BullMQ + Redis
frontend admin: Next.js App Router + TypeScript
database: self-hosted Supabase Postgres + pgvector
LLM mode for local development: LLM_MODE=fake
LLM integration: internal OpenAI-compatible gateway with model aliases
```

Root verification commands should exist as soon as possible:

```bash
make install
make dev
make lint
make typecheck
make test
make test-api
make test-agents
make test-blueprints
make test-web
make test-worker
```

When starting implementation, read these first:

1. `docs/12-implementation-lock-before-coding.md`
2. `docs/13-codex-sprint-1-kickoff.md`
3. `for-codex/STACK_DECISIONS.md`
4. `for-codex/SPRINT_1_TASKS.md`
5. `for-codex/KICKOFF_PROMPT.md`

Do not proceed from Sprint 1 to feature implementation until the scaffold, fake LLM mode, agent run logging, source compliance skeleton, and blueprint loader are working and testable.
