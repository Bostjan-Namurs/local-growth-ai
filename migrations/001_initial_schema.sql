-- LocalGrowth AI initial schema
-- Adjust UUID extension depending on your Supabase/Postgres environment.

create extension if not exists pgcrypto;
create extension if not exists vector;

create type compliance_status as enum ('unknown', 'pending_review', 'approved', 'restricted', 'rejected', 'expired');
create type approval_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
create type agent_run_status as enum ('queued', 'running', 'success', 'failed', 'needs_review');
create type deployment_status as enum ('draft', 'preview_building', 'preview_ready', 'approved_for_production', 'deploying', 'live', 'failed', 'rolled_back');

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text,
  category text,
  vertical text,
  address text,
  city text,
  country text,
  phone text,
  email text,
  website_url text,
  website_status text,
  compliance_status compliance_status not null default 'unknown',
  opportunity_score integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_vertical on businesses(vertical);
create index if not exists idx_businesses_city on businesses(city);
create index if not exists idx_businesses_opportunity on businesses(opportunity_score desc);

create table if not exists source_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  source_type text not null,
  source_name text,
  source_url text,
  license_name text,
  allowed_use text[] not null default '{}',
  disallowed_use text[] not null default '{}',
  attribution_required boolean not null default false,
  attribution_text text,
  contains_personal_data boolean not null default false,
  marketing_permission text not null default 'unknown',
  compliance_status compliance_status not null default 'unknown',
  retention_until timestamptz,
  raw_payload_hash text,
  metadata jsonb not null default '{}',
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_source_records_business on source_records(business_id);
create index if not exists idx_source_records_status on source_records(compliance_status);

create table if not exists website_audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  website_url text,
  website_found boolean,
  has_https boolean,
  has_mobile_layout boolean,
  has_booking boolean,
  has_menu_or_services boolean,
  has_clear_cta boolean,
  seo_score integer,
  performance_score integer,
  issues jsonb not null default '[]',
  screenshots jsonb not null default '[]',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists blueprints (
  id text primary key,
  vertical text not null,
  package_name text not null,
  version text not null default '1.0.0',
  title text not null,
  description text,
  required_inputs jsonb not null default '[]',
  features jsonb not null default '[]',
  schema_json jsonb not null default '{}',
  template_ref text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customer_growth_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  vertical text,
  recommended_package text,
  summary text,
  digital_gaps jsonb not null default '[]',
  likely_customer_segments jsonb not null default '[]',
  missing_data jsonb not null default '[]',
  claims jsonb not null default '[]',
  confidence numeric(4,3),
  approval_status approval_status not null default 'pending',
  generated_by_agent_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  cgp_id uuid references customer_growth_profiles(id),
  blueprint_id text references blueprints(id),
  title text,
  proposal_text text not null,
  setup_price_cents integer,
  monthly_price_cents integer,
  currency text not null default 'EUR',
  outreach_draft text,
  approval_status approval_status not null default 'pending',
  version integer not null default 1,
  generated_by_agent_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generated_apps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  proposal_id uuid references proposals(id),
  blueprint_id text references blueprints(id),
  template_ref text,
  app_spec jsonb not null default '{}',
  content_json jsonb not null default '{}',
  theme_json jsonb not null default '{}',
  repo_url text,
  preview_url text,
  production_url text,
  deployment_status deployment_status not null default 'draft',
  qa_status text,
  approval_status approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_builds (
  id uuid primary key default gen_random_uuid(),
  generated_app_id uuid not null references generated_apps(id) on delete cascade,
  build_type text not null, -- preview | production
  status text not null default 'queued',
  logs_url text,
  artifact_url text,
  commit_sha text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  generated_app_id uuid references generated_apps(id),
  campaign_type text not null,
  goal text,
  channels text[] not null default '{}',
  content_json jsonb not null default '{}',
  compliance_notes jsonb not null default '[]',
  approval_status approval_status not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppression_list (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  contact_value text not null,
  contact_type text not null, -- email | phone | whatsapp | other
  reason text,
  created_at timestamptz not null default now(),
  unique(contact_value, contact_type)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  plan text not null,
  status text not null default 'draft',
  setup_price_cents integer,
  monthly_price_cents integer,
  currency text not null default 'EUR',
  started_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  decision approval_status not null,
  notes text,
  approved_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  workflow text,
  agent_name text not null,
  prompt_version text,
  model_alias text,
  input_hash text,
  output_hash text,
  input_json jsonb not null default '{}',
  output_json jsonb not null default '{}',
  status agent_run_status not null default 'queued',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_business on agent_runs(business_id);
create index if not exists idx_agent_runs_agent on agent_runs(agent_name);
create index if not exists idx_agent_runs_status on agent_runs(status);

-- Vector dimension is a placeholder. Change vector(768) to match your embedding model.
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  source_type text not null,
  source_ref text,
  title text,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_source_type on documents(source_type);
create index if not exists idx_documents_embedding_hnsw on documents using hnsw (embedding vector_cosine_ops);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
