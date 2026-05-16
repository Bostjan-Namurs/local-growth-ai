# Sprint 1 Progress

Last updated: 2026-05-13

Status: complete

## Completed

- Repository scaffold and root verification commands are present.
- `make help` is implemented and included in local macOS verification.
- CI now applies local migrations and runs the Postgres smoke test non-interactively with `DATABASE_URL`.
- Backend uses TypeScript, Fastify, Zod, Drizzle, and pnpm.
- Python backend and worker scaffold have been replaced by TypeScript packages.
- Typed config loading supports safe local defaults with `LLM_MODE=fake`.
- `/health`, `/health/database`, and `/version` are implemented.
- `/health/database` checks connectivity, migration ledger state, and RLS coverage.
- Blueprint registry loader serves `/blueprints` and `/blueprints/:verticalId`.
- Sprint docs now consistently point to the root `blueprints/` directory used by the implementation.
- Stale bootstrap docs were aligned to the current `apps/api`, `apps/web`, `apps/worker`, `blueprints`, and `migrations/drizzle` layout.
- Fake LLM client uses model aliases and deterministic responses.
- Fake LLM aliases include Sprint 1's generic `writer` alias plus the more specific proposal/content writer aliases.
- Agent run logging persists input/output hashes, model alias, approval status, and metadata.
- Read-only agent-run audit endpoints exist at `/agent-runs` and `/agent-runs/:runId`.
- Source compliance skeleton blocks Google Maps/Places scraping paths and automatic marketing sends.
- API safety contract tests assert public LLM, automatic outreach, and production deploy routes are absent.
- Core workflow records are implemented for business profiles, proposals, generated app specs, and preview builds.
- Supabase dev database has migrations `0000` through `0003` recorded in `localgrowth_internal.schema_migrations`.
- Migration runner supports both runtime password prompts and non-interactive `DATABASE_URL` execution.
- Non-interactive migration execution was verified against the approved dev Supabase database through the password prompt wrapper.
- RLS is enabled on all public app tables in the approved dev Supabase database.
- Blueprint catalog sync and Postgres persistence smoke tests pass against the approved dev Supabase database.
- Worker exposes a local fake-mode job contract with prohibited job rejection and no Redis/BullMQ connection.

## Current Verification

```bash
./verify_macos.sh
```

Last result: passed.

```text
API: 81 tests passed
Web: 11 passed, 1 skipped because sandbox blocks the temporary Next route smoke server
Worker: 4 tests passed
```

Final approved dev Supabase checks:

```text
make db-apply-migrations: passed, 4/4 migrations recorded
make db-sync-blueprints: passed, restaurant/salon active and bike_rental draft synced
make db-smoke-postgres: passed, persisted agent runs verified
/health/database: passed, migrations ok and RLS enabled on all 12 app tables
```

## Safety State

- `LLM_MODE=fake` remains the default.
- No production Supabase credentials are committed.
- No Rancher connection has been made.
- No real Ollama/vLLM/LiteLLM service is required.
- No Google Maps scraping has been added.
- No automatic outreach has been added.
- No public LLM endpoint has been exposed.

## Next Backend Work

Sprint 2 has started from this reviewed Sprint 1 completion state. Current progress is tracked in `for-codex/SPRINT_2_PROGRESS.md`.

- Keep backend changes small and reviewable.
- Prefer readiness, auditability, and contract coverage over full product features.
- Keep Redis/BullMQ live processing opt-in and covered by local-only default tests.
