# 03 — Hosting Documentation: Rancher + Supabase + Local LLMs

## Hosting goal

Run LocalGrowth AI fully self-hosted:

- Rancher-managed Kubernetes for application services.
- Self-hosted Supabase/Postgres/pgvector for data and vector memory.
- Local LLM serving inside the cluster.
- Cluster-internal LLM gateway for all agents.
- Human-approved deployment pipeline for generated customer apps.

## Recommended namespace layout

```text
localgrowth-prod       # API, admin UI, workers, app generator
localgrowth-preview    # temporary preview apps
localgrowth-customers  # production customer apps, optional later
ai-runtime             # LLM gateway, vLLM, Ollama, embeddings
supabase               # Supabase stack if moved into cluster
observability          # Prometheus, Grafana, logs, traces
ingress                # ingress controller/cert-manager if separated
```

## Cluster node layout

### Minimum MVP

```text
1 control-plane node
2 general worker nodes
1 GPU worker node
```

### Production-oriented layout

```text
3 control-plane nodes
3+ general worker nodes
1+ GPU worker node pool
separate storage-backed node pool if needed
```

### Node labels

Example:

```bash
kubectl label node gpu-node-01 node-role.localgrowth.ai/gpu=true
kubectl label node gpu-node-01 accelerator=nvidia
kubectl label node gpu-node-01 workload=llm
```

Use node selectors or affinity so LLM pods land on GPU nodes.

## GPU setup in Rancher/RKE2

Recommended approach:

1. Prepare NVIDIA-capable worker nodes.
2. Install/validate the NVIDIA GPU Operator for RKE2/Rancher.
3. Confirm Kubernetes sees GPU capacity.
4. Schedule vLLM pods with `nvidia.com/gpu` limits.
5. Keep LLM services internal.

Verification:

```bash
kubectl describe node gpu-node-01 | grep -i nvidia
kubectl get pods -n gpu-operator
kubectl get nodes -o custom-columns=NAME:.metadata.name,GPU:.status.capacity.nvidia\.com/gpu
```

A GPU workload should request GPUs via limits:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

## Supabase hosting model

You already have self-hosted Supabase with pgvector. Keep the current deployment if it is stable.

### Recommended MVP mode

```text
Rancher/Kubernetes apps  -> private network/DNS -> existing Supabase
```

Advantages:

- Avoids destabilizing the current database.
- Lets the product MVP move fast.
- Keeps database migration risk separate.

### Later production mode

Move Supabase into Kubernetes only after you have:

- tested restore from backup,
- documented migrations/upgrades,
- persistent volumes ready,
- backup jobs ready,
- monitoring ready,
- secrets managed by GitOps or external secrets.

## Supabase connection variables

Backend/worker should use:

```bash
SUPABASE_URL=https://supabase.example.internal
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # server-side only
DATABASE_URL=postgresql://...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend/customer apps.

Codex and MCP tools must not inspect or mutate production Supabase by default. Use local Supabase, a disposable branch, or a clearly approved development project for schema inspection and migration checks. The API `/health` response includes `supabase_local` so local runs can distinguish local/dev configuration from external Supabase targets before any connection code is added.

## pgvector setup

Enable the extension:

```sql
create extension if not exists vector;
```

Create an embeddings table with a fixed dimension matching your embedding model. Example dimension `768` is only a placeholder; change it to match the selected model.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  source_type text not null,
  title text,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(768),
  created_at timestamptz not null default now()
);
```

## Local LLM hosting strategy

Use three layers:

```text
Agents -> LLM Gateway -> Model Servers
```

### Layer 1: Agents

Agents never call raw model endpoints directly. They call model aliases:

```text
classifier
extractor
writer
coder
judge
embedding
```

### Layer 2: LLM Gateway

The gateway provides one internal OpenAI-compatible endpoint:

```text
http://llm-gateway.ai-runtime.svc.cluster.local:4000/v1
```

Responsibilities:

- route model aliases,
- hide implementation details,
- centralize auth,
- log usage,
- apply retry/timeout policy,
- support fallback models,
- enforce model access by agent.

### Layer 3: Model servers

Recommended:

- `vLLM` for GPU production model serving.
- `Ollama` for development, local testing, and smaller models.
- Optional dedicated embedding server.

## vLLM hosting

Use vLLM for production LLM serving when you have GPU nodes.

Cluster service:

```text
http://vllm-writer.ai-runtime.svc.cluster.local:8000/v1
```

Example command:

```bash
vllm serve /models/writer-model \
  --host 0.0.0.0 \
  --port 8000 \
  --api-key ${VLLM_API_KEY}
```

Run separate deployments for different model classes if GPU capacity allows:

```text
vllm-classifier
vllm-extractor
vllm-writer
vllm-coder
vllm-judge
```

For MVP, one or two vLLM deployments can serve multiple aliases.

## Ollama hosting

Use Ollama for development and smaller models.

Cluster service:

```text
http://ollama.ai-runtime.svc.cluster.local:11434
```

Do not expose Ollama publicly. Put it behind the LLM Gateway.

## LiteLLM/custom gateway configuration

Example alias routing:

```yaml
model_list:
  - model_name: classifier
    litellm_params:
      model: openai/local-classifier
      api_base: http://vllm-classifier.ai-runtime.svc.cluster.local:8000/v1
      api_key: os.environ/VLLM_API_KEY

  - model_name: writer
    litellm_params:
      model: openai/local-writer
      api_base: http://vllm-writer.ai-runtime.svc.cluster.local:8000/v1
      api_key: os.environ/VLLM_API_KEY

  - model_name: dev-ollama
    litellm_params:
      model: ollama_chat/gemma3
      api_base: http://ollama.ai-runtime.svc.cluster.local:11434
```

Agent environment:

```bash
LLM_GATEWAY_BASE_URL=http://llm-gateway.ai-runtime.svc.cluster.local:4000/v1
LLM_GATEWAY_API_KEY=...
LLM_MODEL_CLASSIFIER=classifier
LLM_MODEL_EXTRACTOR=extractor
LLM_MODEL_WRITER=writer
LLM_MODEL_CODER=coder
LLM_MODEL_JUDGE=judge
```

## How to link local LLMs to agents

### Step 1: Deploy model server

Deploy vLLM or Ollama inside `ai-runtime`.

### Step 2: Create Kubernetes service

Example:

```text
vllm-writer.ai-runtime.svc.cluster.local:8000
```

### Step 3: Add model alias to gateway config

Add alias such as `writer` or `coder`.

### Step 4: Restart gateway

```bash
kubectl rollout restart deployment/llm-gateway -n ai-runtime
```

### Step 5: Test gateway

```bash
curl http://llm-gateway.ai-runtime.svc.cluster.local:4000/v1/chat/completions \
  -H "Authorization: Bearer $LLM_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "writer",
    "messages": [{"role": "user", "content": "Write a short website hero for a bistro."}]
  }'
```

### Step 6: Configure agent model map

```yaml
agents:
  SourceComplianceAgent:
    model: classifier
  WebsiteAuditAgent:
    model: extractor
  BusinessProfileAgent:
    model: extractor
  ProposalAgent:
    model: writer
  ContentAgent:
    model: writer
  CodePlannerAgent:
    model: coder
  QAAgent:
    model: judge
```

## LLM scaling policy

### MVP

- 1 small classifier/extractor model.
- 1 writer/coder model.
- 1 embedding model.
- Batch long-running jobs through queue.

### Production

- Separate model deployments per task class.
- GPU node pool with autoscaling if available.
- Queue-level concurrency limits.
- Per-agent timeout and retry policy.
- Distinct model cache PVC per deployment or node-local cache.

## GPU time sharing

For low-throughput MVP, you can run fewer models and route aliases to the same deployment. For heavier throughput, use separate deployments or investigate GPU sharing/time-slicing only after stability testing.

## Kubernetes manifests included

See:

- `examples/k8s/vllm-deployment.yaml`
- `examples/k8s/ollama-deployment.yaml`
- `examples/k8s/litellm-gateway.yaml`
- `examples/k8s/network-policy-llm.yaml`

## Ingress rules

Public:

- `admin.localgrowth.example.com` -> admin UI/API.
- generated customer apps -> customer app ingress.

Private only:

- vLLM,
- Ollama,
- LLM gateway unless protected by VPN/auth,
- Supabase internal database port,
- worker/admin internal tools.

## Storage

### Required persistent volumes

| Service | Storage |
|---|---|
| Supabase Postgres | database PVC |
| Supabase Storage | object storage/PVC/S3-compatible |
| vLLM/Ollama | model cache PVC or node-local model path |
| Preview builder | temporary build cache |
| Logs/metrics | observability stack storage |

### Model storage

Option A: PVC-mounted model cache.

Option B: node-local model path for GPU nodes.

Option C: object storage download on init container.

MVP recommendation: start with PVC or node-local cache to avoid repeated model downloads.

## Backups

### Supabase/Postgres

- Daily logical backup.
- Point-in-time recovery if possible.
- Test restore monthly.
- Store backups outside the cluster.

### Object storage

- Generated app assets.
- Screenshots.
- Customer uploads.
- Blueprint versions.

### Configuration

- Helm values.
- Kubernetes manifests.
- Gateway config.
- Model registry.
- Agent prompt versions.

## Monitoring

Track:

- API errors/latency,
- queue depth,
- agent run failure rate,
- LLM request latency,
- model tokens/sec,
- GPU utilization,
- GPU memory,
- preview build failures,
- deploy failures,
- Supabase database health.

## Security checklist

- [ ] LLM services are not public.
- [ ] Supabase service role key is server-only.
- [ ] NetworkPolicies restrict LLM namespace access.
- [ ] Admin dashboard has RBAC.
- [ ] Audit logs are enabled.
- [ ] Backups are encrypted.
- [ ] Generated apps cannot access platform secrets.
- [ ] Customer app deployment namespace is isolated.
- [ ] Outreach/campaign sending requires approval.

## Deployment environments

### Development

- Local Docker Compose or small Rancher namespace.
- Ollama.
- Supabase dev instance.
- No real outreach.

### Staging

- Rancher namespace `localgrowth-staging`.
- Same database schema as prod.
- Test LLM gateway.
- Preview apps only.

### Production

- Rancher namespace `localgrowth-prod`.
- Approved model aliases.
- Production Supabase.
- Observability and backups.
- Strict approval gates.
