# 14. Codex First Sprint Operating Model

This document defines how to start coding with Codex safely and productively.

## 1. Use Codex for controlled implementation tasks

Codex should be used as a coding assistant that works inside the repository, reads `AGENTS.md`, edits files, runs verification commands, and summarizes changes.

Do not use Codex as an unsupervised production automation engine.

## 2. Required files before Codex starts

The repository root should contain:

```text
AGENTS.md
README.md
.env.example
Makefile
docker-compose.dev.yml
docs/
for-codex/
examples/
```

`AGENTS.md` must be at the root because Codex reads `AGENTS.md` files before doing work and builds instruction context from global and project-level guidance.

## 3. Recommended Codex permissions

For early work, use a safe operating mode:

```text
sandbox: workspace-write
network: off unless dependency installation is required
approval: on-request or interactive approval
```

Avoid unrestricted access until the repo and workflow are mature.

## 4. First Codex task sequence

Do not start with: `Build the whole product`.

Start with small tasks:

```text
Task 1: repo scaffold and local development bootstrap
Task 2: config loader and health endpoint
Task 3: database/Drizzle foundation
Task 4: blueprint registry loader
Task 5: fake LLM client
Task 6: agent run logger
Task 7: SourceComplianceAgent skeleton
Task 8: BusinessProfileAgent skeleton
Task 9: admin API for approvals
Task 10: vertical onboarding draft API
```

Each task should include tests.

## 5. First Codex prompt

Use `for-codex/SPRINT_01_TASK_01_REPO_SCAFFOLD.md` as the first implementation prompt.

The first task should create:

```text
repo structure
.env.example
docker-compose.dev.yml
Makefile
apps/api minimal Fastify app
apps/worker placeholder
apps/web admin scaffold
blueprints copied examples
basic tests
CI skeleton
```

## 6. Codex review questions after each task

After every Codex run, the reviewer should ask:

```text
Did Codex follow AGENTS.md?
Did Codex change only the requested scope?
Did Codex add tests?
Did tests run?
Did Codex commit or expose secrets?
Did Codex introduce prohibited automation?
Did Codex create abstractions that are too large for MVP?
Are generated docs consistent with code?
```

## 7. Codex handoff from admin UI

Later, when the admin adds a new business type from the UI, the system should not let Codex directly modify production.

Safe flow:

```text
Admin creates vertical draft
→ system validates required fields
→ admin approves implementation request
→ system generates Codex task bundle
→ Codex creates branch changes
→ CI runs
→ developer reviews PR
→ merge
→ blueprint is indexed into pgvector
→ admin activates vertical
```

## 8. Sprint 1 acceptance criteria

Sprint 1 is complete when:

```text
make test passes
make lint passes
make typecheck passes
API health endpoint works
local database can start
blueprint loader tests pass
fake LLM mode works
SourceComplianceAgent rejects unsafe lead source modes
agent run records can be created and completed
```

Do not continue beyond scaffolded fake-mode proposal/app-spec slices until this foundation is working.
