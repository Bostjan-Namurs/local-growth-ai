# Sprint 1 Task 1 — Repository Scaffold and Local Development Bootstrap

Use this as the first Codex implementation task.

## Prompt

```text
Read AGENTS.md, README.md, docs/12-pre-coding-decision-lock.md,
docs/13-local-dev-bootstrap.md, docs/14-codex-first-sprint-operating-model.md,
and for-codex/IMPLEMENTATION_BRIEF.md.

Do not implement the full product yet.

Implement Sprint 1 Task 1: repository scaffold and local development bootstrap.

Requirements:
1. Create the repo structure described in docs/12-pre-coding-decision-lock.md.
2. Add .env.example using docs/13-local-dev-bootstrap.md.
3. Add docker-compose.dev.yml for Postgres with pgvector and Redis.
4. Add a root Makefile with dev-up, dev-down, lint, test, test-api,
   test-blueprints, test-agents, format, api-dev, web-dev, and worker-dev targets.
5. Add apps/api with a minimal FastAPI app exposing GET /health and GET /version.
6. Add backend config loading from environment variables.
7. Add basic tests for /health and config loading.
8. Add apps/web placeholder package.json and initial admin route placeholders.
9. Add apps/worker placeholder with a minimal worker entrypoint.
10. Add migrations/ and copy the provided SQL migration files into it.
11. Add blueprints/ and copy registry and starter blueprint examples into it.
12. Add a simple blueprint loader skeleton with tests if feasible in this task.
13. Add a CI skeleton under .github/workflows/test.yml.
14. Do not add production outreach, Google scraping, automatic deployment,
    payment processing, or real LLM calls.
15. Do not commit secrets.

Before coding, write a short plan.
After coding, summarize files changed and commands run.
```

## Acceptance criteria

The task is accepted when:

- repo structure exists;
- `.env.example` exists;
- `docker-compose.dev.yml` exists;
- root `Makefile` exists;
- backend `/health` endpoint exists;
- config loader exists;
- at least one backend test exists;
- blueprints are placed in predictable location;
- CI skeleton exists;
- no prohibited automation is implemented;
- Codex reports verification commands run.

## Out of scope

- Real LLM calls;
- full agent workflow;
- real lead discovery;
- Google Maps integration;
- automatic cold outreach;
- production deployment;
- payment/billing integration;
- complex admin UI;
- customer app generation.
