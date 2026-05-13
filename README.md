# LocalGrowth AI — Codex-ready combined repository

Start with [`START_HERE.md`](START_HERE.md).

For exact setup commands, see [`CODEX_STARTUP_COMMANDS.md`](CODEX_STARTUP_COMMANDS.md).

This combined package includes the starter repo, documentation bundle, blueprints, migrations, infrastructure examples, and Codex startup scripts.

---

# LocalGrowth AI — Starter Repository

This is a starter implementation scaffold for the LocalGrowth AI MVP.

It is intentionally small. The goal is to give Codex and developers a concrete repository shape, local development commands, a TypeScript Fastify health endpoint, a blueprint loader, fake LLM mode, and initial tests.

## Current scope

Implemented in this scaffold:

- root `AGENTS.md` for Codex instructions;
- `.env.example`;
- `docker-compose.dev.yml` for Postgres/pgvector and Redis;
- root `Makefile`;
- TypeScript Fastify API app;
- `/health`, `/health/database`, `/version`, `/blueprints`, `/businesses`, `/approvals`, `/agent-runs`, `/vertical-drafts`, workflow, app spec, and preview build endpoints;
- typed config loader;
- Drizzle schema and generated migration for core Sprint 1 tables;
- audited migration runner for local/dev Supabase Postgres;
- dev Supabase readiness checks for migration ledger state and RLS coverage;
- blueprint registry loader;
- fake LLM client;
- in-memory and Postgres agent run logger skeletons;
- SourceComplianceAgent, BusinessProfileAgent, ProposalAgent, and AppSpecAgent skeletons;
- backend tests;
- Next.js admin scaffold with dashboard, lead, approval, agent-run, app, business-type, and settings routes;
- TypeScript worker scaffold;
- SQL migrations copied from documentation;
- bike rental blueprint files.

Not implemented yet:

- real LLM gateway calls;
- real lead discovery;
- real app generation;
- automatic outreach;
- production deployment.

Current implementation progress is tracked in
[`for-codex/SPRINT_1_PROGRESS.md`](for-codex/SPRINT_1_PROGRESS.md).

## Local quick start

```bash
cp .env.example .env
make install
make dev
./verify_macos.sh
make api-dev
make admin-dev
```

Optional approved dev Supabase flow:

```bash
make db-check-supabase
make db-apply-migrations
make db-sync-blueprints
make db-smoke-postgres
```

These targets prompt for the database password unless `DATABASE_URL` is already set. Do not write real Supabase passwords into committed files.

Expected endpoints:

```text
GET http://localhost:8000/health
GET http://localhost:8000/version
GET http://localhost:8000/blueprints
GET http://localhost:8000/blueprints/bike_rental
GET http://localhost:8000/businesses
GET http://localhost:8000/approvals
GET http://localhost:8000/vertical-drafts
```

## First Codex task after this scaffold

Use:

```text
for-codex/SPRINT_01_TASK_02_CONFIG_HEALTH_BLUEPRINTS.md
```

Then continue with:

```text
for-codex/SPRINT_01_TASK_03_FAKE_LLM_AND_AGENT_RUNS.md
```
