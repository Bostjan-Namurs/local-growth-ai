# 13. Local Development Bootstrap

This document defines how developers and Codex should run the MVP locally before deploying to Rancher.

## 1. Local development goals

The local setup must allow a developer or Codex to:

```text
start Postgres with pgvector-compatible settings, or connect to self-hosted Supabase
start Redis for worker queues
run the backend API
run tests without a real LLM
load blueprints
validate schemas
run fake agent flows
avoid production secrets
```

## 2. Environment file

Create `.env.example` in the repository root. Use `examples/dev/.env.example` as the source.

Required rules:

```text
.env.example can be committed
.env must not be committed
service role keys are server-side only
real outreach stays disabled in local development
production deploy stays disabled in local development
LLM_MODE=fake is the default until the gateway is deployed
```

Minimum required variables:

```bash
APP_ENV=local
APP_NAME=localgrowth-ai
LOG_LEVEL=info

API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/localgrowth
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=replace_me
SUPABASE_SERVICE_ROLE_KEY=replace_me_server_side_only

REDIS_URL=redis://localhost:6379/0

LLM_MODE=fake
LLM_GATEWAY_BASE_URL=http://localhost:4000/v1
LLM_GATEWAY_API_KEY=local-dev-key
LLM_MODEL_CLASSIFIER=classifier
LLM_MODEL_EXTRACTOR=extractor
LLM_MODEL_PROFILER=profiler
LLM_MODEL_PROPOSAL_WRITER=proposal_writer
LLM_MODEL_CONTENT_WRITER=content_writer
LLM_MODEL_CODER=coder
LLM_MODEL_JUDGE=judge
LLM_MODEL_EMBEDDING=embedding

ENABLE_REAL_OUTREACH=false
ENABLE_PRODUCTION_DEPLOY=false
ENABLE_CODEX_HANDOFF=false
```

## 3. Docker Compose development file

Create `docker-compose.dev.yml` with Postgres/pgvector and Redis for local testing. If the team prefers to connect to an existing self-hosted Supabase instance, keep this file as a fallback.

Use `examples/dev/docker-compose.dev.yml` as the source.

Services:

```text
postgres: pgvector/pgvector:pg16
redis: redis:7-alpine
```

## 4. Makefile targets

Create a root `Makefile`. Use `examples/dev/Makefile` as the source.

Required targets:

```bash
make install
make dev-up
make dev-down
make api-dev
make admin-dev
make worker-dev
make lint
make typecheck
make test
make test-api
make test-blueprints
make test-agents
make test-worker
make format
```

At the beginning, some commands can be placeholders. Codex should replace placeholders with real commands as each app/package is created.

## 5. Local fake LLM mode

The MVP must work in fake LLM mode before real model serving is connected.

Fake mode should:

```text
return deterministic outputs
support model aliases
produce testable structured JSON
write agent run logs
not require network access
not call Ollama, vLLM, or LiteLLM
```

This lets Codex and developers test workflows safely before local model infrastructure is complete.

## 6. Blueprint local test

The local dev environment should be able to validate:

```text
packages/blueprints/registry.yaml
packages/blueprints/bike-rental/blueprint.yaml
packages/blueprints/bike-rental/input.schema.json
packages/blueprints/bike-rental/app_config.example.json
```

A failing blueprint should fail tests before it reaches the admin UI or app generator.

## 7. Database local test

The local Postgres should support pgvector. The first database test should verify:

```sql
create extension if not exists vector;
```

The initial schema can be implemented through Alembic while preserving `examples/db/*.sql` as reference migrations.

## 8. Safety defaults

Local development defaults:

```text
real outreach disabled
production deployment disabled
Codex handoff disabled
fake LLM enabled
no production secrets
no public LLM endpoints
```

These defaults should be visible in `.env.example`, config loading, and tests.
