# Sprint 2 Progress

Last updated: 2026-05-15

Status: in progress

## Completed

- Worker-owned BullMQ, ioredis, and Zod dependencies were added to `apps/worker`.
- Worker queue configuration now defaults to local mode through `WORKER_QUEUE_MODE=local`.
- Redis/BullMQ mode is explicit through `WORKER_QUEUE_MODE=redis` and requires `REDIS_URL`.
- Worker health reports queue mode, queue name, Redis configuration presence, and fake LLM mode.
- Local queue adapter accepts only validated fake-mode jobs and stores deterministic in-memory queue entries for tests.
- Redis queue adapter is available behind explicit config, but default verification does not connect to Redis.
- `make test-worker-redis` is available as an opt-in live Redis smoke test after `make dev-up`.
- Worker job payloads now have runtime schemas before enqueue.
- Prohibited job names, non-fake LLM mode, and approval-gated app spec generation remain blocked.
- Deterministic worker processor stubs produce placeholder-only outputs with input hashes, output hashes, model aliases, approval status, and audit event payloads.
- API now exposes an authenticated internal-only worker enqueue boundary at `POST /internal/worker-jobs`.
- Worker enqueue requests are persisted as queued `agent_runs` records with request metadata, model alias, approval status, and input hash.
- Worker result reports are accepted only on the internal boundary and update the queued `agent_runs` record with output hash, result metadata, and worker audit event payloads.

## Current Verification

```bash
pnpm --dir apps/worker test
pnpm --dir apps/worker typecheck
./verify_macos.sh
```

Optional live Redis smoke, not included in default verification:

```bash
make dev-up
make test-worker-redis
```

Current environment note: not run, because the `docker` CLI is unavailable in this shell.

Last result: passed.

```text
API: 89 tests passed
Blueprints: 9 tests passed
Agents: 19 tests passed
Web: 11 passed, 1 skipped because sandbox blocks the temporary Next route smoke server
Worker: 10 tests passed
```

## Safety State

- `LLM_MODE=fake` remains the only accepted worker LLM mode.
- Redis/BullMQ is not contacted by default.
- No production Supabase credentials are committed.
- No Rancher connection has been made.
- No real Ollama/vLLM/LiteLLM service is required.
- No Google Maps scraping has been added.
- No automatic outreach has been added.
- No public LLM endpoint has been exposed.

## Next Backend Work

- Run `make test-worker-redis` when local Docker Redis is intentionally started with `make dev-up`.
- Persist worker completion events through the database-backed agent run logger before any real asynchronous workflow is enabled.
- Keep API enqueue endpoints private/internal until authentication and approval boundaries are implemented.
