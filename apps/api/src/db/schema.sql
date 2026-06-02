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

-- Estruturas solicitadas no roadmap SaaS. Elas são seguras para aplicar
-- incrementalmente: não removem dados existentes e permitem ativar as telas
-- conforme as credenciais externas forem configuradas.
create table if not exists push_subscriptions (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists proposal_templates (
  id text primary key default gen_random_uuid()::text,
  workspace_id text,
  service_type text not null,
  name text not null,
  content text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposal_versions (
  id text primary key default gen_random_uuid()::text,
  lead_id text not null,
  workspace_id text not null default 'default',
  version_number integer not null,
  content text not null,
  service_type text,
  generated_by text not null default 'user' check (generated_by in ('user', 'ai')),
  created_at timestamptz not null default now()
);

create table if not exists inbox_messages (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  lead_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  channel text not null default 'whatsapp',
  content text not null,
  status text not null default 'unread',
  phone_from text,
  created_at timestamptz not null default now()
);

create table if not exists cadence_templates (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  steps jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cadence_enrollments (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  lead_id text not null,
  cadence_id text not null references cadence_templates(id) on delete cascade,
  current_step integer not null default 0,
  enrolled_at timestamptz not null default now(),
  next_action_at timestamptz,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'failed'))
);

create table if not exists api_keys (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists vertical_prompts (
  id text primary key default gen_random_uuid()::text,
  segment_keywords text[] not null default '{}',
  service_type text not null default 'generic',
  system_prompt text not null,
  score_weights jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_workspace on push_subscriptions(workspace_id);
create index if not exists idx_proposal_templates_workspace on proposal_templates(workspace_id);
create index if not exists idx_proposal_versions_lead on proposal_versions(workspace_id, lead_id, version_number desc);
create index if not exists idx_inbox_messages_workspace on inbox_messages(workspace_id, created_at desc);
create index if not exists idx_cadence_templates_workspace on cadence_templates(workspace_id);
create index if not exists idx_cadence_enrollments_due on cadence_enrollments(workspace_id, status, next_action_at);
create index if not exists idx_api_keys_workspace on api_keys(workspace_id);
