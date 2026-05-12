# Codex Prompts for Implementation

Use these prompts one at a time.

## Prompt 1: bootstrap

```text
Read AGENTS.md, for-codex/IMPLEMENTATION_BRIEF.md, and for-codex/REPO_STRUCTURE.md. Bootstrap the repository structure for the MVP. Do not implement Google Maps scraping, campaign sending, or production deployment. Add tests and an .env.example. Make minimal, high-confidence changes.
```

## Prompt 2: database

```text
Implement the initial database migration using examples/db/001_initial_schema.sql. Add a migration runner appropriate for the selected backend stack. Add tests that verify the core tables exist and pgvector is enabled. Do not change the schema semantics unless required by the framework.
```

## Prompt 3: LLM gateway client

```text
Implement an LLM client package with fake mode and gateway mode. Gateway mode must use an OpenAI-compatible /v1/chat/completions endpoint and model aliases. Fake mode must return deterministic schema-valid outputs for tests. Add timeout, retry, and usage metadata capture.
```

## Prompt 4: SourceComplianceAgent

```text
Implement SourceComplianceAgent using deterministic rules. Reject or restrict Google Maps scraping source types. Mark public Nominatim bulk discovery as restricted. Mark manual imports as pending or approved based on config. Store all results in agent_runs and update source_records.
```

## Prompt 5: BusinessProfileAgent

```text
Implement BusinessProfileAgent. It should take business, source records, website audit, and blueprint context, call the LLM client or fake client, validate output against examples/agents/business_profile.output.schema.json, store customer_growth_profiles, and log the agent run. Unknown facts must become missing_data.
```

## Prompt 6: ProposalAgent

```text
Implement ProposalAgent. It should generate a proposal from an existing customer_growth_profile and selected blueprint. The proposal must be pending approval and must not be sent externally. Add tests for proposal creation and approval gating.
```

## Prompt 7: Admin UI

```text
Create a minimal admin UI with lead list, business detail, source records, website audit, CGP, proposal, and approval actions. Keep it simple. Do not add customer-facing pages yet.
```

## Prompt 8: Kubernetes manifests

```text
Create Kubernetes manifests or Helm chart values for api, worker, admin-ui, llm-gateway, and vLLM using the examples in examples/k8s. Ensure LLM services are ClusterIP only and no public ingress is created for vLLM/Ollama.
```


## Add a new business vertical

Use `for-codex/ADD_BUSINESS_TYPE_PROMPT.md` together with the admin-generated `codex_task.json`.

Never ask Codex to "just create a bike rental app". Ask it to add a versioned vertical module, update the registry, add tests, and keep unsafe facts as placeholders.
