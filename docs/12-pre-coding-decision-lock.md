# 12. Pre-Coding Decision Lock

This document freezes the first implementation assumptions so Codex and developers do not make conflicting architecture choices.

The goal is not to finalize the entire product forever. The goal is to create a stable MVP foundation that can be tested, reviewed, and deployed in the current infrastructure: self-hosted Rancher, self-hosted Supabase/Postgres with pgvector, and local LLM serving.

## 1. Decision: update documentation before coding

Yes. Before coding begins, update only the documentation that affects implementation correctness:

- final MVP repository structure;
- backend/frontend/worker stack choices;
- environment variable contract;
- local development bootstrap;
- verification commands;
- CI expectations;
- Codex task boundaries;
- agent safety rules;
- first implementation sprint.

After this pre-coding layer is committed, start coding. Do not keep expanding product theory before implementation. Future documentation updates should come from real coding friction, test failures, review feedback, or repeated Codex mistakes.

## 2. Locked MVP stack

Use this stack unless an existing repository already has a committed alternative.

| Layer | Locked decision |
|---|---|
| Repository style | Simple monorepo, no Nx/Turborepo initially |
| Backend API | FastAPI |
| Backend language | Python 3.12 |
| Python package manager | `uv` |
| Backend validation | Pydantic v2 |
| Database access | SQLAlchemy 2.x |
| Database migrations | Alembic, with existing SQL examples preserved as references |
| Worker | Celery |
| Queue broker | Redis |
| Frontend admin | Next.js App Router + TypeScript |
| Frontend package manager | `pnpm` |
| Database | Self-hosted Supabase Postgres |
| Vector database | pgvector inside Supabase Postgres |
| Object storage | Supabase Storage or S3-compatible storage |
| Local LLM dev | Fake LLM mode by default; Ollama optional |
| Production LLM serving | vLLM/Ollama behind internal gateway, depending on model size |
| LLM gateway | OpenAI-compatible internal gateway, LiteLLM-compatible if possible |
| Hosting | Rancher-managed Kubernetes |
| Customer app deploy | Preview deployment first; production deployment requires approval |

## 3. First implementation principle

Build a working vertical slice, not a full platform.

The first vertical slice should support:

```text
business lead record
→ source/compliance record
→ website audit stub/manual input
→ CGP generation in fake LLM mode
→ blueprint selection
→ proposal generation in fake LLM mode
→ admin approval
→ app spec generation
→ preview deployment stub
```

Real LLM calls can be added after the agent contract, fake mode, logging, and schema validation work correctly.

## 4. First business types

Initial production candidates:

```text
restaurant
salon
bike_rental
```

Bike rental is included because it validates that the blueprint system can add a new business type that maps to a reusable app pattern: `rental_booking`.

## 5. Implementation boundaries

For the first sprint, Codex must not implement:

```text
Google Maps scraping
automatic cold email sending
automatic SMS/WhatsApp sending
direct production deployment without approval
arbitrary full custom app code generation
payment processing
multi-tenant customer app runtime
native mobile app generation
model fine-tuning
autonomous production Codex changes
```

## 6. Locked MVP repository structure

Recommended initial layout:

```text
localgrowth-ai/
  AGENTS.md
  README.md
  Makefile
  .env.example
  docker-compose.dev.yml

  apps/
    api/
      pyproject.toml
      alembic.ini
      alembic/
      app/
        main.py
        config.py
        db.py
        models/
        schemas/
        routes/
        services/
      tests/

    worker/
      pyproject.toml
      worker.py
      tasks/
      tests/

    admin-ui/
      package.json
      app/
      components/
      lib/
      tests/

  packages/
    agents/
      localgrowth_agents/
      tests/

    llm/
      localgrowth_llm/
      tests/

    blueprints/
      registry.yaml
      restaurant/
      salon/
      bike-rental/
      loader.py
      schemas/
      tests/

    app-generator/
      templates/
      generator.py
      schemas/
      tests/

    shared/
      localgrowth_shared/
      tests/

  migrations/
    sql-examples/
    versions/

  infra/
    k8s/
    helm/
    llm/

  docs/
  for-codex/
```

## 7. Locked model aliases

Agents must call LLM aliases through the gateway. They must not call raw model names directly.

```text
classifier
extractor
profiler
proposal_writer
content_writer
coder
judge
embedding
```

## 8. Locked root verification commands

The implementation should expose these root commands as soon as possible:

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
make test-agents
make test-blueprints
make test-worker
```

At the beginning, some commands may be placeholders, but Codex should replace placeholders with real checks as modules are implemented.

## 9. Locked non-negotiable rules

1. Do not implement Google Maps scraping.
2. Do not send marketing messages automatically.
3. Do not deploy production customer apps automatically.
4. Do not expose local LLM endpoints publicly.
5. Do not invent business facts, prices, reviews, inventory availability, legal terms, insurance terms, partnerships, or certifications.
6. Do not allow Codex-generated verticals to become active without human review and merge.
7. Do not use raw LLM output without schema validation.
8. Do not let customer app generation bypass templates.

## 10. What should not be locked yet

These can change after MVP feedback:

```text
exact pricing packages
exact frontend design system
final multi-tenant vs one-app-per-customer strategy
final LLM model names
final marketing channel integrations
native mobile apps
advanced CRM features
white-label reseller features
```

## 11. Ready-to-code checklist

Before the first Codex task:

```text
[ ] Put AGENTS.md at repository root.
[ ] Put this documentation bundle inside the repository or copy the relevant docs.
[ ] Add .env.example.
[ ] Add docker-compose.dev.yml.
[ ] Add root Makefile.
[ ] Add initial README local development instructions.
[ ] Start Codex with one small task only.
[ ] Require Codex to produce a plan before editing files.
[ ] Require Codex to summarize files changed and commands run.
```

## 12. Recommendation

After this implementation lock is added, start coding. The first sprint should build the skeleton and infrastructure needed to let future Codex tasks work safely.
