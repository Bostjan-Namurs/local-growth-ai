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

Create `.env.example` in the repository root. Use `examples/dev/.env.example` as the source. The committed `.env.example` files are the canonical local environment contract; the block below documents the minimum policy-sensitive variables and expected defaults.

Required rules:

```text
.env.example can be committed
.env must not be committed
service role keys are server-side only
real outreach stays disabled in local development
production deploy stays disabled in local development
LLM_MODE=fake is the default until the gateway is deployed
Supabase MCP or database tooling must point at local/dev resources unless explicitly approved
```

Minimum required variables:

```bash
APP_ENV=local
APP_NAME=localgrowth-ai
APP_VERSION=0.1.0
LOG_LEVEL=info

API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

DATA_STORE=memory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/localgrowth
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=replace_me
SUPABASE_SERVICE_ROLE_KEY=replace_me_server_side_only

EMBEDDING_MODEL_ALIAS=embedding
EMBEDDING_DIMENSIONS=384

REDIS_URL=redis://localhost:6379/0

LLM_MODE=fake
LLM_GATEWAY_BASE_URL=http://localhost:4000/v1
LLM_GATEWAY_API_KEY=local-dev-key
LLM_MODEL_CLASSIFIER=classifier
LLM_MODEL_EXTRACTOR=extractor
LLM_MODEL_PROFILER=profiler
LLM_MODEL_WRITER=writer
LLM_MODEL_PROPOSAL_WRITER=proposal_writer
LLM_MODEL_CONTENT_WRITER=content_writer
LLM_MODEL_CODER=coder
LLM_MODEL_JUDGE=judge
LLM_MODEL_EMBEDDING=embedding

JWT_SECRET=replace_me_local_only
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
DEPLOYMENT_MODE=disabled

ENABLE_REAL_OUTREACH=false
ENABLE_PRODUCTION_DEPLOY=false
ENABLE_CODEX_HANDOFF=false
```

The backend `/health` route reports database and Supabase connection classification without opening a Supabase or database connection:

```text
database_configured
database_local
database_connection_kind  # unset | local | supabase | external | invalid
data_store                # memory | postgres
supabase_configured
supabase_local
supabase_connection_kind  # unset | local | supabase | external | invalid
```

During Sprint 1, Codex should treat `database_connection_kind=supabase`, `database_connection_kind=external`, `supabase_connection_kind=supabase`, or `supabase_connection_kind=external` as a stop sign for any MCP/database mutation unless the task explicitly approves a non-local target.

For approved local/dev Supabase checks, do not write database passwords into source files or committed env examples. Use the runtime prompt:

```bash
make db-check-supabase
```

The default direct database host is `db.<project-ref>.supabase.co`. Some Supabase projects expose that host as IPv6-only; if the local network has no IPv6 route, use the dashboard-provided IPv4 pooler host instead:

```bash
SUPABASE_POOLER_HOST=aws-<pooler-id>-<region>.pooler.supabase.com make db-check-supabase
```

When a pooler host is set, the script defaults the database user to `postgres.<project-ref>`. Override `SUPABASE_DB_USER`, `SUPABASE_DB_PORT`, or `SUPABASE_PROJECT_REF` only for an approved dev target.

If native DNS is unstable but the pooler host resolves through another resolver, pass the IPv4 address as `SUPABASE_DB_HOSTADDR` while keeping `SUPABASE_POOLER_HOST` set for TLS:

```bash
SUPABASE_POOLER_HOST=aws-<pooler-id>-<region>.pooler.supabase.com SUPABASE_DB_HOSTADDR=<ipv4-address> make db-check-supabase
```

When using a Supabase database password inside `DATABASE_URL`, percent-encode reserved characters before running the API. For example, `#` must be encoded as `%23`; otherwise Node URL parsing treats it as a fragment and the backend correctly reports `database_connection_kind=invalid`.

Apply committed database migrations with the same runtime password prompt:

```bash
make db-apply-migrations
```

The migration runner executes `migrations/drizzle/*.sql` in sorted order and records the filename plus SHA-256 checksum in `localgrowth_internal.schema_migrations`. That schema is intentionally separate from public app tables because it is internal deployment bookkeeping, not Data API surface.

For an approved dev database that was migrated manually before this runner existed, create the migration ledger without re-running table creation SQL:

```bash
MIGRATIONS_BASELINE_EXISTING=true make db-apply-migrations
```

Only use baseline mode after confirming the target database already has the matching schema. After migrations are applied or baselined, sync blueprint catalog rows and run the Postgres persistence smoke test:

```bash
make db-sync-blueprints
make db-smoke-postgres
```

If `DATABASE_URL` is already set, those targets use it. Otherwise they prompt for the approved Supabase dev database password and build a process-local, percent-encoded `DATABASE_URL` for the child command. The password is not written to `.env`, docs, or shell history.

## 3. Docker Compose development file

Create `docker-compose.dev.yml` with Postgres/pgvector and Redis for local testing. If the team prefers to connect to an existing self-hosted Supabase instance, keep this file as a fallback.

Use `examples/dev/docker-compose.dev.yml` as the source.

Services:

```text
postgres: pgvector/pgvector:pg16
redis: redis:7-alpine
```

## 4. Makefile targets

Create a root `Makefile`. The root `Makefile` is canonical; keep `examples/dev/Makefile` aligned as a copyable reference.

Required targets:

```bash
make install
make dev
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
make test-web
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
blueprints/registry.yaml
blueprints/bike-rental/blueprint.yaml
blueprints/bike-rental/input.schema.json
blueprints/bike-rental/app_config.example.json
```

A failing blueprint should fail tests before it reaches the admin UI or app generator.

## 7. Database local test

The local Postgres should support pgvector. The first database test should verify:

```sql
create extension if not exists vector;
```

The initial schema can be implemented through Drizzle migrations while preserving `examples/db/*.sql` as reference migrations.

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
