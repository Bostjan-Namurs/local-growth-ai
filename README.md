# LocalGrowth AI — Codex-ready combined repository

Start with [`START_HERE.md`](START_HERE.md).

For exact setup commands, see [`CODEX_STARTUP_COMMANDS.md`](CODEX_STARTUP_COMMANDS.md).

This combined package includes the starter repo, documentation bundle, blueprints, migrations, infrastructure examples, and Codex startup scripts.

---

# LocalGrowth AI — Starter Repository

This is a starter implementation scaffold for the LocalGrowth AI MVP.

It is intentionally small. The goal is to give Codex and developers a concrete repository shape, local development commands, a FastAPI health endpoint, a blueprint loader, fake LLM mode, and initial tests.

## Current scope

Implemented in this scaffold:

- root `AGENTS.md` for Codex instructions;
- `.env.example`;
- `docker-compose.dev.yml` for Postgres/pgvector and Redis;
- root `Makefile`;
- FastAPI API app;
- `/health`, `/version`, `/blueprints`, and `/blueprints/{vertical_id}` endpoints;
- typed config loader;
- blueprint registry loader;
- fake LLM client;
- in-memory agent run logger skeleton;
- backend tests;
- Next.js admin placeholder structure;
- worker placeholder;
- SQL migrations copied from documentation;
- bike rental blueprint files.

Not implemented yet:

- real LLM gateway calls;
- real Supabase integration;
- real lead discovery;
- real app generation;
- automatic outreach;
- production deployment.

## Local quick start

```bash
cp .env.example .env
make dev-up
cd apps/api
python -m pip install -e '.[dev]'
python -m pytest tests
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected endpoints:

```text
GET http://localhost:8000/health
GET http://localhost:8000/version
GET http://localhost:8000/blueprints
GET http://localhost:8000/blueprints/bike_rental
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
