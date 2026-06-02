-- NODERE Intelligence — apps/api schema
-- Execute no Supabase SQL editor ou via psql DATABASE_URL

create extension if not exists pgcrypto;

-- Contas/workspaces e usuários da plataforma.
-- Cada usuário criado pelo administrador pertence a um workspace. As rotas
-- escopadas usam workspace_id para que empresas diferentes não vejam dados umas das outras.
create table if not exists nodere_workspaces (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  owner_email text not null,
  plan text not null default 'trial',
  credits integer not null default 20,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nodere_platform_users (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null references nodere_workspaces(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  active boolean not null default true,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_users_workspace on nodere_platform_users(workspace_id);
create index if not exists idx_platform_users_email on nodere_platform_users(lower(email));

-- Empresas / leads
create table if not exists nodere_companies (
  id text primary key,
  workspace_id text not null default 'default',
  name text not null,
  category text not null default '',
  city text not null default '',
  state text not null default '',
  address text not null default '',
  phone text,
  whatsapp text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  youtube text,
  rating numeric(3,2),
  review_count integer,
  maps_url text,
  latitude numeric,
  longitude numeric,
  status text not null default 'Novo Lead',
  score integer not null default 0,
  opportunity_level text not null default 'Baixa',
  enrichment_status text not null default 'none',
  last_contact_at timestamptz,
  -- jsonb para sinais digitais e scores compostos
  digital_signals jsonb not null default '{}',
  detected_opportunities jsonb not null default '[]',
  suggestions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notas CRM de cada empresa
create table if not exists nodere_company_notes (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references nodere_companies(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Histórico de buscas realizadas
create table if not exists nodere_searches (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  city text not null,
  state text,
  segment text not null,
  keyword text,
  result_count integer not null default 0,
  source text not null default 'mock',
  company_ids jsonb not null default '[]',
  created_at timestamptz not null default now(),
  last_ran_at timestamptz not null default now()
);

-- Índices para queries frequentes
create index if not exists idx_companies_city_state on nodere_companies(city, state);
create index if not exists idx_companies_status on nodere_companies(status);
create index if not exists idx_companies_score on nodere_companies(score desc);
create index if not exists idx_notes_company on nodere_company_notes(company_id);
create index if not exists idx_searches_created on nodere_searches(created_at desc);

-- Operadores comerciais e metas mensais
create table if not exists nodere_operators (
  id text primary key,
  workspace_id text not null default 'default',
  name text not null,
  email text,
  role text not null default 'operator',
  created_at timestamptz not null default now()
);

create table if not exists nodere_operator_goals (
  workspace_id text not null default 'default',
  operator_id text not null references nodere_operators(id) on delete cascade,
  month text not null,
  target_searches integer not null default 20,
  target_contacts integer not null default 15,
  target_deals integer not null default 3,
  target_revenue_brl integer not null default 36000,
  updated_at timestamptz not null default now(),
  primary key (operator_id, month)
);

create index if not exists idx_operator_goals_month on nodere_operator_goals(month desc);

-- Configuracoes publicas e operacionais persistentes.
-- Regra NODERE: tema/layout/funil nunca devem depender apenas de localStorage,
-- porque atualizacoes, troca de navegador ou deploys nao podem apagar a operacao.
create table if not exists nodere_app_settings (
  key text primary key,
  workspace_id text not null default 'default',
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Migração segura para bancos que já tinham as tabelas antes do multiusuário.
alter table nodere_companies add column if not exists workspace_id text not null default 'default';
alter table nodere_company_notes add column if not exists workspace_id text not null default 'default';
alter table nodere_searches add column if not exists workspace_id text not null default 'default';
alter table nodere_operators add column if not exists workspace_id text not null default 'default';
alter table nodere_operator_goals add column if not exists workspace_id text not null default 'default';
alter table nodere_app_settings add column if not exists workspace_id text not null default 'default';

create index if not exists idx_companies_workspace on nodere_companies(workspace_id);
create index if not exists idx_notes_workspace on nodere_company_notes(workspace_id);
create index if not exists idx_searches_workspace on nodere_searches(workspace_id, created_at desc);
create index if not exists idx_operators_workspace on nodere_operators(workspace_id);
create index if not exists idx_app_settings_workspace on nodere_app_settings(workspace_id);
