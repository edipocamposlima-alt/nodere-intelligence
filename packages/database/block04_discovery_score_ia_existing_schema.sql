-- BLOCO 04 - Discovery, Score NODERE e IA Comercial
-- Schema existente NODERE: usa nodere_companies como fonte de leads.
-- Nao criar tabelas paralelas users/workspaces/leads/companies.

create table if not exists public.nodere_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  query text not null,
  source text not null,
  result_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_discovery_runs_workspace_created
  on public.nodere_discovery_runs(workspace_id, created_at desc);

create table if not exists public.nodere_ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text,
  action text not null,
  provider text,
  model text,
  tokens_input integer default 0,
  tokens_output integer default 0,
  status text not null default 'success',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_ai_usage_log_workspace_created
  on public.nodere_ai_usage_log(workspace_id, created_at desc);

create index if not exists idx_nodere_ai_usage_log_company
  on public.nodere_ai_usage_log(company_id);

alter table public.nodere_discovery_runs enable row level security;
alter table public.nodere_ai_usage_log enable row level security;
