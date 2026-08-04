-- NODERE V7 - owner entitlement, model discovery, sourced research and domain events
-- Idempotent, workspace-scoped and safe for production reapplication.

create table if not exists public.nodere_owner_entitlements (
  user_id uuid primary key references auth.users(id) on delete restrict,
  workspace_id text not null references public.nodere_workspaces(id) on delete restrict,
  account_type text not null default 'OWNER_INTERNAL' check (account_type = 'OWNER_INTERNAL'),
  billing_exempt boolean not null default true,
  plan_enforcement_exempt boolean not null default true,
  internal_credit_blocking boolean not null default false,
  usage_metering_enabled boolean not null default true,
  provider_limits_still_apply boolean not null default true,
  active boolean not null default true,
  granted_by text not null default 'migration:v7',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists nodere_owner_entitlements_workspace_user_idx
  on public.nodere_owner_entitlements(workspace_id, user_id);

alter table public.nodere_ai_model_registry
  add column if not exists provider_available boolean not null default false,
  add column if not exists availability_checked_at timestamptz,
  add column if not exists supports_responses boolean not null default true,
  add column if not exists supports_tools boolean not null default false,
  add column if not exists supports_web_search boolean not null default false,
  add column if not exists supports_audio boolean not null default false,
  add column if not exists rate_limit_profile jsonb not null default '{}'::jsonb,
  add column if not exists discovery_source text not null default 'curated_registry',
  add column if not exists availability_error text;

create table if not exists public.nodere_research_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  company_id text references public.nodere_companies(id) on delete set null,
  query text not null,
  mode text not null default 'complete' check (mode in ('quick','complete','batch','refresh')),
  status text not null default 'draft' check (status in ('draft','running','review','approved','persisted','failed','cancelled')),
  facts jsonb not null default '[]'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  recommended_services jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  identity_confidence integer not null default 0 check (identity_confidence between 0 and 100),
  data_confidence integer not null default 0 check (data_confidence between 0 and 100),
  commercial_score integer not null default 0 check (commercial_score between 0 and 100),
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  persisted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodere_research_runs_workspace_created_idx
  on public.nodere_research_runs(workspace_id, created_at desc);
create index if not exists nodere_research_runs_company_created_idx
  on public.nodere_research_runs(workspace_id, company_id, created_at desc)
  where company_id is not null;

create table if not exists public.nodere_domain_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  actor_id text,
  causation_id text,
  correlation_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists nodere_domain_events_aggregate_idx
  on public.nodere_domain_events(workspace_id, aggregate_type, aggregate_id, occurred_at desc);
create index if not exists nodere_domain_events_type_idx
  on public.nodere_domain_events(workspace_id, event_type, occurred_at desc);

create table if not exists public.nodere_test_data_registry (
  id uuid primary key default gen_random_uuid(),
  workspace_id text references public.nodere_workspaces(id) on delete cascade,
  batch_id text not null,
  entity_table text not null,
  entity_id text not null,
  purpose text not null,
  created_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  cleaned_at timestamptz,
  unique (batch_id, entity_table, entity_id)
);

create index if not exists nodere_test_data_registry_open_idx
  on public.nodere_test_data_registry(batch_id, created_at)
  where cleaned_at is null;

-- The immutable Supabase Auth UUID is the only source of the internal-owner entitlement.
with canonical_owner as (
  select id
  from auth.users
  where lower(email) = 'edipo.lima@nodere.com.br'
  order by created_at asc
  limit 1
), owner_membership as (
  update public.nodere_platform_users platform_user
  set role = 'owner',
      name = 'Édipo Lima',
      active = true,
      status = 'active',
      visibility_level = 'full',
      updated_at = now()
  from canonical_owner owner_user
  where platform_user.auth_user_id = owner_user.id
  returning owner_user.id as user_id, platform_user.workspace_id
)
insert into public.nodere_owner_entitlements (
  user_id, workspace_id, account_type, billing_exempt, plan_enforcement_exempt,
  internal_credit_blocking, usage_metering_enabled, provider_limits_still_apply,
  active, granted_by, updated_at
)
select user_id, workspace_id, 'OWNER_INTERNAL', true, true, false, true, true, true, 'migration:v7', now()
from owner_membership
on conflict (user_id) do update set
  workspace_id = excluded.workspace_id,
  account_type = excluded.account_type,
  billing_exempt = excluded.billing_exempt,
  plan_enforcement_exempt = excluded.plan_enforcement_exempt,
  internal_credit_blocking = excluded.internal_credit_blocking,
  usage_metering_enabled = excluded.usage_metering_enabled,
  provider_limits_still_apply = excluded.provider_limits_still_apply,
  active = excluded.active,
  granted_by = excluded.granted_by,
  updated_at = now();

alter table public.nodere_owner_entitlements enable row level security;
alter table public.nodere_research_runs enable row level security;
alter table public.nodere_domain_events enable row level security;
alter table public.nodere_test_data_registry enable row level security;

alter table public.nodere_owner_entitlements force row level security;
alter table public.nodere_research_runs force row level security;
alter table public.nodere_domain_events force row level security;
alter table public.nodere_test_data_registry force row level security;

revoke all on table public.nodere_owner_entitlements, public.nodere_research_runs,
  public.nodere_domain_events, public.nodere_test_data_registry from public, anon, authenticated;
grant select, insert, update, delete on table public.nodere_owner_entitlements,
  public.nodere_research_runs, public.nodere_domain_events, public.nodere_test_data_registry to service_role;

comment on table public.nodere_owner_entitlements is
  'Formal internal-owner entitlement keyed by immutable Supabase Auth user_id; never a fake balance.';
comment on table public.nodere_research_runs is
  'Review-first public-source commercial research with citations and confidence scores.';
comment on table public.nodere_test_data_registry is
  'Exact registry for deterministic homologation-data cleanup.';
