-- 002_vertical_onboarding_and_rental.sql
-- Historical/future reference only. Do not apply as an active Sprint 1 migration.
-- Adds vertical onboarding workflow and reusable rental module.
-- Adjust table names/types to match the production schema conventions.

create table if not exists verticals (
  id uuid primary key default gen_random_uuid(),
  vertical_id text not null unique,
  name text not null,
  app_pattern text not null,
  template_id text not null,
  status text not null default 'draft',
  version text not null default '1.0.0',
  registry_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vertical_drafts (
  id uuid primary key default gen_random_uuid(),
  vertical_id text not null,
  created_by uuid,
  status text not null default 'draft',
  wizard_payload jsonb not null default '{}'::jsonb,
  generated_blueprint jsonb,
  generated_input_schema jsonb,
  generated_app_config jsonb,
  generated_campaign_playbook jsonb,
  generated_qa_checklist jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vertical_versions (
  id uuid primary key default gen_random_uuid(),
  vertical_id text not null,
  version text not null,
  status text not null default 'draft',
  blueprint_hash text,
  input_schema_hash text,
  app_config_example_hash text,
  campaign_playbook_hash text,
  qa_checklist_hash text,
  git_commit_sha text,
  activated_at timestamptz,
  activated_by uuid,
  created_at timestamptz not null default now(),
  unique (vertical_id, version)
);

create table if not exists vertical_codex_tasks (
  id uuid primary key default gen_random_uuid(),
  vertical_draft_id uuid references vertical_drafts(id) on delete set null,
  vertical_id text not null,
  task_type text not null default 'add_business_vertical',
  mode text not null default 'blueprint_only',
  status text not null default 'created',
  branch_name text,
  pull_request_url text,
  task_payload jsonb not null default '{}'::jsonb,
  verification_commands jsonb not null default '[]'::jsonb,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);

create table if not exists vertical_task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references vertical_codex_tasks(id) on delete cascade,
  event_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Reusable rental module. This should support bike rental first, then other rental verticals.

create table if not exists rental_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  quantity_total integer,
  quantity_available integer,
  price_hourly numeric,
  price_half_day numeric,
  price_daily numeric,
  price_weekly numeric,
  deposit_amount numeric,
  image_url text,
  confirmed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rental_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  confirmed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rental_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  status text not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_bookings_return_after_pickup check (return_at > pickup_at)
);

create table if not exists rental_booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references rental_bookings(id) on delete cascade,
  rental_item_id uuid not null references rental_items(id),
  quantity integer not null default 1,
  constraint rental_booking_items_quantity_positive check (quantity > 0)
);

create index if not exists idx_verticals_vertical_id on verticals(vertical_id);
create index if not exists idx_vertical_drafts_vertical_id on vertical_drafts(vertical_id);
create index if not exists idx_vertical_codex_tasks_vertical_id on vertical_codex_tasks(vertical_id);
create index if not exists idx_rental_items_business_id on rental_items(business_id);
create index if not exists idx_rental_bookings_business_id on rental_bookings(business_id);
