# Sprint 1 Tasks for Codex

## Task 1.1 — Repository scaffold

Create the root folder layout, `.env.example`, local compose file, Makefile, and README local setup instructions.

Verification:

```bash
make help
```

## Task 1.2 — Fastify skeleton

Create `apps/api` with Fastify, config loading, and `GET /health`.

Verification:

```bash
make test-api
```

## Task 1.3 — Database and Drizzle foundation

Create Drizzle schema definitions, database config helpers, and initial migration folder.

Verification:

```bash
make test-api
```

## Task 1.4 — Core models

Implement initial models for:

```text
businesses
source_records
agent_runs
approvals
vertical_drafts
blueprints
```

Verification:

```bash
make test-api
```

## Task 1.5 — LLM gateway client with fake mode

Implement alias-based client with `LLM_MODE=fake` and `LLM_MODE=gateway`.

Verification:

```bash
make test-agents
```

## Task 1.6 — Blueprint loader

Implement loader for `blueprints/registry.yaml` and vertical folders.

Verification:

```bash
make test-blueprints
```

## Task 1.7 — SourceComplianceAgent skeleton

Implement deterministic compliance rules for source types.

Verification:

```bash
make test-agents
```

## Task 1.8 — CI skeleton

Add CI configuration or documented pipeline that runs:

```bash
make lint
make typecheck
make test
```

## Sprint 1 completion rule

Do not start Sprint 2 until these commands exist and either pass or have documented placeholders:

```bash
make lint
make typecheck
make test
make test-api
make test-agents
make test-blueprints
make test-web
```
