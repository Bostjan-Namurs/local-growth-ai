# LocalGrowth AI Documentation Bundle

**Product:** LocalGrowth AI — AI-assisted website/app/reservation/campaign generator for local businesses.  
**Current infrastructure assumption:** self-hosted Rancher/Kubernetes, self-hosted Supabase with Postgres + pgvector, and local LLMs served inside the cluster.  
**Prepared for:** initial production planning and Codex implementation.

## What this bundle contains

```text
README.md
AGENTS.md

docs/
  01-product-documentation.md
  02-technical-architecture.md
  03-hosting-rancher-supabase-local-llms.md
  04-agent-system-codex-implementation.md
  05-data-compliance-and-lead-sources.md
  06-api-contracts.md
  07-operational-runbooks.md
  08-implementation-roadmap.md
  09-adding-business-types-blueprints.md
  10-admin-ui-codex-handoff.md
  11-bike-rental-vertical-example.md
  12-pre-coding-decision-lock.md
  13-local-dev-bootstrap.md
  14-codex-first-sprint-operating-model.md
  references.md

examples/
  db/001_initial_schema.sql
  k8s/vllm-deployment.yaml
  k8s/ollama-deployment.yaml
  k8s/litellm-gateway.yaml
  k8s/network-policy-llm.yaml
  llm/litellm.config.yaml
  agents/agent_state.schema.json
  agents/business_profile.output.schema.json
  blueprints/registry.yaml
  blueprints/restaurant_reservation_plus.md
  blueprints/salon_booking_plus.md
  blueprints/bike-rental/blueprint.yaml
  blueprints/bike-rental/input.schema.json
  blueprints/bike-rental/app_config.example.json
  blueprints/bike-rental/campaign_playbook.yaml
  blueprints/bike-rental/qa_checklist.md
  api/vertical_draft_request.schema.json
  dev/.env.example
  dev/docker-compose.dev.yml
  dev/Makefile
  ci/github-actions-test.yml

for-codex/
  IMPLEMENTATION_BRIEF.md
  INITIAL_TASKS.md
  REPO_STRUCTURE.md
  CODEX_PROMPTS.md
  ADD_BUSINESS_TYPE_PROMPT.md
  CODEX_HANDOFF_WORKFLOW.md
  .codex/config.example.toml
```

## Recommended reading order

1. `docs/01-product-documentation.md`
2. `docs/02-technical-architecture.md`
3. `docs/03-hosting-rancher-supabase-local-llms.md`
4. `docs/04-agent-system-codex-implementation.md`
5. `for-codex/IMPLEMENTATION_BRIEF.md`
6. `for-codex/INITIAL_TASKS.md`
7. `docs/09-adding-business-types-blueprints.md`
8. `docs/10-admin-ui-codex-handoff.md`
9. `docs/11-bike-rental-vertical-example.md`

## Key decisions baked into this plan

- Use **template-driven app generation**, not unconstrained code generation.
- Use **human approval gates** before outreach, deployment, billing, and customer-facing campaign sends.
- Use **self-hosted Supabase/Postgres/pgvector** for business data, vector memory, agent run state, and app configuration.
- Use **local LLMs** through a cluster-internal LLM gateway so agents can call models via a single OpenAI-compatible interface.
- Use **Rancher/Kubernetes namespaces** to isolate product services, AI runtime, Supabase, generated customer previews, and observability.
- Do **not** depend on scraping Google Maps as the default lead source. Track data source, license, allowed use, retention, and opt-out state per record.

## MVP principle

The MVP should prove this loop:

```text
compliant lead source
  -> website/digital audit
  -> business growth profile
  -> proposal
  -> generated preview app from blueprint
  -> admin approval
  -> manual outreach
  -> customer purchase
  -> managed deployment
  -> recurring campaign support
```

Do not start with fully autonomous crawling, fully autonomous code generation, or fully autonomous marketing sends.


## New business type expansion model

There are two different workflows:

```text
New customer in an existing business type
  -> handled fully from admin UI
  -> no Codex needed unless template code is missing

New business type / vertical, for example bike rental
  -> admin starts a guided vertical onboarding wizard
  -> system creates a versioned blueprint draft
  -> admin approves the draft
  -> Codex receives a constrained implementation task
  -> Codex prepares repo changes, tests, examples, and a pull request
  -> developer/admin reviews and activates the vertical
```

Codex should not be treated as a model that "learns" business types. It should be treated as a coding agent that reads repository instructions, blueprint files, schemas, examples, and tests, then implements the requested changes in a branch. New vertical knowledge is stored in blueprints, registry files, schemas, examples, and pgvector documents.


## Coding start decision

The recommended next action is:

```text
1. Copy this documentation into the real repository root.
2. Ensure AGENTS.md is at the repository root.
3. Add .env.example, docker-compose.dev.yml, Makefile, and CI skeleton from examples/dev and examples/ci.
4. Start Codex with for-codex/SPRINT_01_TASK_01_REPO_SCAFFOLD.md.
5. Keep Codex in small task mode with tests and review.
```

The documentation is now ready for coding to begin. Do not expand post-MVP documentation before the first implementation sprint.

## v3 implementation kickoff additions

This version adds the final pre-coding implementation lock. Before coding starts, read:

1. `docs/12-implementation-lock-before-coding.md`
2. `docs/13-codex-sprint-1-kickoff.md`
3. `for-codex/STACK_DECISIONS.md`
4. `for-codex/SPRINT_1_TASKS.md`
5. `for-codex/KICKOFF_PROMPT.md`

New example files:

```text
.env.example
examples/local-dev/docker-compose.dev.yml
examples/local-dev/Makefile.example
examples/ci/github-actions-test.yml
examples/fixtures/mvp_seed_data.json
```

Decision: after these files are copied into the real repository, start coding Sprint 1. Do not keep expanding documentation before implementation. Future documentation updates should come from real coding friction, test failures, or review feedback.
