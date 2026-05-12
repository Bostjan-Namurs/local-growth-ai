# 02 — Technical Architecture

## Architecture goals

- Self-hostable on Rancher/Kubernetes.
- Uses existing self-hosted Supabase with Postgres + pgvector.
- Supports local LLMs through one internal gateway.
- Produces auditable agent runs.
- Uses template-driven app generation.
- Keeps human approval gates before risky actions.
- Supports gradual move from MVP to production.

## High-level architecture

```text
                           +--------------------------+
                           |        Admin UI          |
                           | Next.js / dashboard      |
                           +------------+-------------+
                                        |
                                        v
+------------------+        +-----------+------------+        +-----------------------+
| Lead Sources     | -----> | Backend API            | -----> | Supabase/Postgres     |
| manual/licensed  |        | FastAPI/NestJS         |        | pgvector + auth/store |
+------------------+        +-----------+------------+        +-----------+-----------+
                                        |                                 |
                                        v                                 v
                              +---------+----------+          +-----------+------------+
                              | Worker/Orchestrator| <------> | Vector/RAG Memory     |
                              | agents + queues    |          | blueprints/docs       |
                              +---------+----------+          +------------------------+
                                        |
                                        v
                              +---------+----------+
                              | LLM Gateway        |
                              | LiteLLM/custom     |
                              +----+----------+----+
                                   |          |
                                   v          v
                              +----+--+   +---+----+
                              | vLLM |   | Ollama |
                              | GPU  |   | dev    |
                              +------+   +--------+
                                        |
                                        v
                              +---------+----------+
                              | App Generator      |
                              | templates + config |
                              +---------+----------+
                                        |
                                        v
                              +---------+----------+
                              | Preview/Deploy     |
                              | Git + CI + Rancher |
                              +--------------------+
```

## Runtime services

### Core product namespace

Recommended namespace: `localgrowth-prod`

Services:

- `admin-ui`: Next.js dashboard.
- `api`: backend API.
- `worker`: asynchronous jobs and agent orchestration.
- `scheduler`: periodic jobs.
- `preview-builder`: creates preview builds from templates.
- `deployment-controller`: deploys approved generated apps.

### AI runtime namespace

Recommended namespace: `ai-runtime`

Services:

- `llm-gateway`: single OpenAI-compatible endpoint for internal apps.
- `vllm-*`: GPU-hosted production LLM services.
- `ollama`: development/small-model service.
- `embedding-service`: optional separate embedding model service.

### Data namespace

Recommended namespace: `supabase`

Services:

- Supabase Postgres.
- Supabase API gateway/Kong.
- Auth.
- Storage.
- Realtime.
- Functions.
- Studio, if required.

If your Supabase is currently Docker-based outside Kubernetes, keep it stable during MVP and connect the product by internal VPN/private DNS. Move Supabase into Rancher only after backup/restore and upgrade processes are proven.

### Observability namespace

Recommended namespace: `observability`

Services:

- Prometheus.
- Grafana.
- Loki or equivalent log store.
- OpenTelemetry Collector.
- GPU metrics exporter/stack.

## Data flow

### Lead creation flow

```text
lead source/import
  -> SourceComplianceAgent
  -> LeadDiscovery/Import service
  -> deduplication
  -> business record
  -> source_records record
  -> WebsiteAuditAgent job
  -> opportunity score
  -> admin review queue
```

### Proposal flow

```text
business record
  -> WebsiteAuditAgent output
  -> BusinessProfileAgent
  -> BlueprintMatcherAgent
  -> ProposalAgent
  -> proposal draft
  -> admin approval
```

### App generation flow

```text
approved proposal
  -> AppSpecAgent
  -> ContentAgent
  -> template config generation
  -> schema validation
  -> preview build
  -> QAAgent
  -> admin approval
  -> production deployment
```

### Campaign flow

```text
customer business profile
  -> CampaignAgent
  -> compliance/suppression check
  -> campaign draft
  -> admin/customer approval
  -> send/publish manually or via approved integration
  -> performance tracking
```

## Recommended service boundaries

### Backend API

Responsibilities:

- Auth and RBAC.
- CRUD for businesses, proposals, apps, campaigns.
- Admin approval actions.
- Agent run inspection.
- API contracts for admin UI.

### Worker/orchestrator

Responsibilities:

- Job queue consumption.
- Agent execution.
- LLM gateway calls.
- Website audits.
- Vector search.
- Preview generation.
- QA checks.

### LLM Gateway

Responsibilities:

- Model aliases.
- Request routing.
- Local vLLM/Ollama endpoints.
- Per-agent default model.
- Retries/timeouts.
- Usage logging.
- Optional fallback model.

### App Generator

Responsibilities:

- Load approved template.
- Create app config.
- Create content JSON/Markdown.
- Apply theme.
- Validate generated config.
- Build preview artifact.
- Return preview URL.

## Agent execution model

Use a deterministic graph/state machine first. Add a framework such as LangGraph only when the graph becomes complex enough to need graph-native state, branching, resumability, and multi-agent routing.

Each agent should be implemented as:

```python
class AgentProtocol(Protocol):
    name: str
    input_model: type[BaseModel]
    output_model: type[BaseModel]

    async def run(self, state: AgentState) -> AgentResult:
        ...
```

Every agent run must store:

- run ID,
- business ID,
- agent name,
- input JSON hash,
- output JSON hash,
- model alias,
- prompt version,
- status,
- error message,
- start/end timestamps.

## Model routing

Use aliases instead of raw model names:

```yaml
classifier: local/small-instruct
extractor: local/medium-instruct
writer: local/writer-instruct
coder: local/coder
judge: local/reasoning-judge
embedding: local/embedding
```

Agents call:

```text
POST http://llm-gateway.ai-runtime.svc.cluster.local:4000/v1/chat/completions
```

The gateway routes to vLLM or Ollama.

## Supabase/pgvector usage

Use Supabase for:

- businesses,
- source records,
- website audits,
- customer growth profiles,
- proposals,
- generated apps,
- campaigns,
- agent runs,
- audit logs,
- blueprint knowledge base,
- vector embeddings.

Use pgvector for:

- blueprint retrieval,
- approved proposal examples,
- app generation examples,
- vertical-specific knowledge,
- internal documentation search.

Avoid storing large screenshots or generated app bundles directly in Postgres. Use object storage and store references.

## Database domains

| Domain | Tables |
|---|---|
| Leads/businesses | `businesses`, `source_records`, `website_audits` |
| AI profiles | `customer_growth_profiles`, `agent_runs`, `documents` |
| Product generation | `blueprints`, `generated_apps`, `app_builds` |
| Sales | `proposals`, `subscriptions` |
| Marketing | `campaigns`, `campaign_assets`, `suppression_list` |
| Governance | `approvals`, `audit_logs` |

## API design principles

- Version all APIs under `/api/v1`.
- Use UUIDs.
- Store approval actions separately from generated data.
- Never overwrite agent output silently; create new versions.
- Use status enums, not free-text statuses.
- Add `source_confidence` and `data_confidence` for AI-generated profiles.

## Required approval gates

| Action | Gate |
|---|---|
| Use a new data source | Admin approval |
| Outreach message send | Admin approval |
| Proposal visible to customer | Admin approval |
| Production deployment | Admin approval |
| Campaign send/publish | Admin/customer approval |
| Billing activation | Admin approval |

## Security architecture

### Authentication and authorization

- Use Supabase Auth or external identity provider.
- Enforce RBAC in backend API.
- Roles: `admin`, `operator`, `sales`, `developer`, `viewer`.
- Business-owner customer portal should be a separate role/tenant boundary.

### Secrets

- Store LLM gateway tokens, SMTP credentials, OAuth secrets, Supabase service keys, and deployment tokens in Kubernetes secrets.
- Prefer sealed secrets or external secrets for GitOps.
- Never expose Supabase service role key to frontend.

### Network

- LLM services should be cluster-internal only.
- Public ingress only for admin UI/API/customer apps.
- Use NetworkPolicy to restrict access to LLM and Supabase services.

### Data protection

- Store source/license metadata.
- Store suppression/opt-out state.
- Provide delete/export flow for personal data.
- Log access to customer/business records.

## Observability

Track:

- API latency/error rate,
- worker job duration/failures,
- agent success/failure rate,
- LLM token usage/latency,
- GPU utilization/memory,
- proposal approval rate,
- preview build success rate,
- deployment success rate,
- campaign approval/send metrics.

## Testing strategy

### Unit tests

- agent schemas,
- scoring logic,
- source compliance logic,
- LLM response parsing,
- app config validation.

### Integration tests

- Supabase/Postgres connection,
- pgvector search,
- LLM gateway adapter,
- website audit worker,
- preview generator.

### End-to-end tests

- create lead,
- generate audit,
- generate CGP,
- generate proposal,
- approve app spec,
- generate preview,
- approve deployment.

## Failure handling

Each agent should return one of:

```text
success
needs_more_data
needs_admin_review
source_not_allowed
validation_failed
llm_failed
tool_failed
```

Agents should never hide uncertainty. Unknown fields must remain unknown.
