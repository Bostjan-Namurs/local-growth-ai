# Codex Implementation Brief

## Goal

Start implementation of LocalGrowth AI as a production-oriented MVP.

The MVP must support:

1. manual/compliant business lead import,
2. source compliance records,
3. website audit record,
4. Customer Growth Profile generation,
5. proposal generation,
6. admin approval,
7. template app spec generation,
8. preview build placeholder,
9. local LLM gateway adapter,
10. audit logs.

## Preferred stack

```text
backend: FastAPI + Pydantic + SQLAlchemy/SQLModel
worker: Celery or Dramatiq + Redis
frontend: Next.js
storage: Supabase Postgres + pgvector
llm: OpenAI-compatible gateway endpoint
infra: Rancher/Kubernetes
```

If a different stack is already present in the repository, adapt to the existing stack instead of replacing it.

## Hard constraints

- No Google Maps scraping implementation.
- No campaign auto-send implementation in MVP.
- No unrestricted code generation.
- No public LLM endpoints.
- No service role key in frontend.
- Every agent output must be schema validated.
- Every risky action must require approval.

## Build first

Start with backend + database + LLM gateway client. The admin UI can be minimal until the workflow works.

## Suggested repository structure

See `for-codex/REPO_STRUCTURE.md`.

## First acceptance test

A developer should be able to:

1. create a business lead via API,
2. attach a source record,
3. run source compliance,
4. create a website audit record,
5. generate a CGP using fake LLM mode,
6. generate a proposal using fake LLM mode,
7. approve the proposal,
8. generate an app spec,
9. create a preview build record.

## Fake LLM mode

Implement fake mode before real LLM integration:

```bash
LLM_MODE=fake
```

Fake mode returns deterministic JSON fixtures so tests pass without model servers.

## Real LLM mode

Use:

```bash
LLM_MODE=gateway
LLM_GATEWAY_BASE_URL=http://llm-gateway.ai-runtime.svc.cluster.local:4000/v1
LLM_GATEWAY_API_KEY=...
```

## Main modules to create

```text
apps/api
apps/admin-ui
apps/worker
packages/agents
packages/llm
packages/blueprints
packages/app-generator
packages/shared
infra/k8s
migrations
```

## Coding principles

- Implement interfaces before complex behavior.
- Use JSON schemas/Pydantic models.
- Keep agents small.
- Keep prompts versioned.
- Create audit log events for all approvals and agent runs.
