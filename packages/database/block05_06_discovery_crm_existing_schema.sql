-- BLOCO 05/06 - Discovery + CRM usando schema real NODERE
-- Aplicar manualmente no Supabase SQL Editor do projeto correto.
-- Este script NAO cria tabelas users/workspaces/companies/leads paralelas.
-- Ele preserva nodere_workspaces, nodere_platform_users e nodere_companies.

create extension if not exists pgcrypto;

alter table public.nodere_companies
  add column if not exists place_id text,
  add column if not exists google_place_id text,
  add column if not exists opening_hours jsonb not null default '{}',
  add column if not exists business_status text,
  add column if not exists website_scan jsonb not null default '{}',
  add column if not exists social_scan jsonb not null default '{}',
  add column if not exists opportunity_reasons jsonb not null default '[]',
  add column if not exists crm_value numeric not null default 0,
  add column if not exists expected_close_at date,
  add column if not exists lost_reason text,
  add column if not exists source_detail text;

create index if not exists idx_nodere_companies_place_id
  on public.nodere_companies(workspace_id, place_id);

create index if not exists idx_nodere_companies_google_place_id
  on public.nodere_companies(workspace_id, google_place_id);

create index if not exists idx_nodere_companies_discovery_score
  on public.nodere_companies(workspace_id, score desc, opportunity_level);

create index if not exists idx_nodere_companies_status_workspace
  on public.nodere_companies(workspace_id, status, updated_at desc);

create table if not exists public.nodere_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  query text not null,
  source text not null default 'google_places',
  result_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_discovery_runs_workspace
  on public.nodere_discovery_runs(workspace_id, created_at desc);

alter table public.nodere_discovery_runs enable row level security;

drop policy if exists nodere_discovery_runs_service_role_all on public.nodere_discovery_runs;
create policy nodere_discovery_runs_service_role_all
  on public.nodere_discovery_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.company_contacts (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public.nodere_companies(id) on delete cascade,
  workspace_id text not null default 'default',
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  linkedin_url text,
  notes text,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_company_contacts_company
  on public.company_contacts(workspace_id, company_id);

create table if not exists public.calendar_events (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text references public.nodere_companies(id) on delete set null,
  contact_id text,
  title text not null,
  type text not null default 'followup',
  priority text not null default 'media',
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  assigned_to text,
  created_by text,
  status text not null default 'pendente',
  channel text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_range
  on public.calendar_events(workspace_id, start_at, end_at);

create table if not exists public.communications (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  contact_id text references public.company_contacts(id) on delete set null,
  type text not null default 'note',
  direction text not null default 'manual',
  subject text,
  body text,
  sent_by text,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  metadata jsonb not null default '{}'
);

create index if not exists idx_communications_company
  on public.communications(workspace_id, company_id, sent_at desc);

create table if not exists public.proposal_versions (
  id text primary key default gen_random_uuid()::text,
  lead_id text not null,
  workspace_id text not null default 'default',
  version_number integer not null,
  content text not null,
  service_type text,
  generated_by text not null default 'user',
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_versions_lead
  on public.proposal_versions(workspace_id, lead_id, version_number desc);
