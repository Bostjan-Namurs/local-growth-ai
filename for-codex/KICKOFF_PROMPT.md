# Codex Kickoff Prompt — Start Coding

Use this as the first prompt to Codex after the documentation is copied into the repository root.

```text
Read AGENTS.md, docs/12-implementation-lock-before-coding.md, docs/13-codex-sprint-1-kickoff.md, for-codex/STACK_DECISIONS.md, and for-codex/SPRINT_1_TASKS.md.

Do not implement the full product.
Do not implement real crawling.
Do not implement Google Maps scraping.
Do not implement automatic campaign sending.
Do not implement production deployment automation.

Start with Sprint 1, Task 1.1 only: repository scaffold.

Requirements:
- Create the monorepo structure described in the docs.
- Add AGENTS.md at the repo root if it is missing.
- Add .env.example.
- Add docker-compose.dev.yml for local Postgres/pgvector and Redis.
- Add a root Makefile with placeholder commands that can be replaced as modules are implemented.
- Add README local development instructions.
- Create empty or minimal folders for apps/api, apps/admin, workers/agent-worker, packages/agent-core, packages/blueprints, packages/shared-schemas, infra, docs, and for-codex.
- Copy existing blueprint examples into packages/blueprints if present.
- Do not create unrelated product features.

Before editing files, produce a short plan.
After editing files, summarize:
- files changed
- verification commands run
- anything incomplete
- recommended next task
```
```
