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
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nodere_platform_users (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null references nodere_workspaces(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'operator' check (role in ('owner', 'admin', 'operator', 'viewer')),
  active boolean not null default true,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_users_workspace on nodere_platform_users(workspace_id);
create index if not exists idx_platform_users_email on nodere_platform_users(lower(email));

-- Fase 4: cargos personalizados e limites de acesso administrativo.
create table if not exists custom_roles (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  description text,
  permissions jsonb not null default '{}',
  color text not null default '#1E6FDB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index if not exists idx_custom_roles_workspace on custom_roles(workspace_id);

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
  logo_url text,
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
alter table nodere_companies add column if not exists logo_url text;
alter table nodere_companies add column if not exists cnpj text;
alter table nodere_companies add column if not exists legal_name text;
alter table nodere_companies add column if not exists razao_social text;
alter table nodere_companies add column if not exists situacao_cadastral text;
alter table nodere_companies add column if not exists data_abertura text;
alter table nodere_companies add column if not exists capital_social text;
alter table nodere_companies add column if not exists cnae_principal text;
alter table nodere_companies add column if not exists socios jsonb not null default '[]';
alter table nodere_companies add column if not exists endereco_fiscal text;
alter table nodere_companies add column if not exists owner_id text;
alter table nodere_company_notes add column if not exists workspace_id text not null default 'default';
alter table nodere_searches add column if not exists workspace_id text not null default 'default';
alter table nodere_operators add column if not exists workspace_id text not null default 'default';
alter table nodere_operator_goals add column if not exists workspace_id text not null default 'default';
alter table nodere_app_settings add column if not exists workspace_id text not null default 'default';
alter table nodere_workspaces add column if not exists onboarding_completed boolean not null default false;
alter table nodere_workspaces add column if not exists wl_domain text;
alter table nodere_workspaces add column if not exists wl_name text;
alter table nodere_workspaces add column if not exists wl_logo_url text;
alter table nodere_workspaces add column if not exists wl_primary_color text;
alter table nodere_workspaces add column if not exists wl_enabled boolean not null default false;

do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'nodere_platform_users' and constraint_name = 'nodere_platform_users_role_check'
  ) then
    alter table nodere_platform_users drop constraint nodere_platform_users_role_check;
  end if;
end $$;

alter table nodere_platform_users
  add constraint nodere_platform_users_role_check check (role in ('owner', 'admin', 'operator', 'viewer'));

alter table nodere_platform_users add column if not exists custom_role_id text;
alter table nodere_platform_users add column if not exists status text not null default 'active';
alter table nodere_platform_users add column if not exists last_active_at timestamptz;
alter table nodere_platform_users add column if not exists visibility_level text not null default 'read_edit';
alter table nodere_platform_users add column if not exists module_permissions jsonb not null default '{}';

-- Compatibilidade opcional com Supabase Auth/RLS para a fase SaaS comercial.
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  name text not null,
  plan text not null default 'trial',
  credits integer not null default 20,
  credits_expires_at timestamptz default (now() + interval '30 days'),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  invited_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table workspace_members add column if not exists name text;
alter table workspace_members add column if not exists custom_role_id text;
alter table workspace_members add column if not exists status text not null default 'active';
alter table workspace_members add column if not exists last_active_at timestamptz;
alter table workspace_members add column if not exists visibility_level text not null default 'read_edit';
alter table workspace_members add column if not exists module_permissions jsonb not null default '{}';

create index if not exists idx_companies_workspace on nodere_companies(workspace_id);
create index if not exists idx_companies_owner on nodere_companies(workspace_id, owner_id);
create index if not exists idx_notes_workspace on nodere_company_notes(workspace_id);
create index if not exists idx_searches_workspace on nodere_searches(workspace_id, created_at desc);
create index if not exists idx_operators_workspace on nodere_operators(workspace_id);
create index if not exists idx_app_settings_workspace on nodere_app_settings(workspace_id);
create index if not exists idx_workspaces_wl_domain on nodere_workspaces(wl_domain);

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

create table if not exists schedules (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text,
  assignee_id text,
  title text not null,
  channel text not null default 'WhatsApp',
  scheduled_at timestamptz,
  notified boolean not null default false,
  status text not null default 'open',
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
create index if not exists idx_schedules_due on schedules(workspace_id, status, scheduled_at);
create index if not exists idx_inbox_messages_workspace on inbox_messages(workspace_id, created_at desc);
create index if not exists idx_cadence_templates_workspace on cadence_templates(workspace_id);
create index if not exists idx_cadence_enrollments_due on cadence_enrollments(workspace_id, status, next_action_at);
create index if not exists idx_api_keys_workspace on api_keys(workspace_id);

-- V2 — cadastro completo, agenda, catalogo e comunicacoes.
alter table nodere_companies add column if not exists nome_fantasia text;
alter table nodere_companies add column if not exists cnaes_secundarios text[] default '{}';
alter table nodere_companies add column if not exists porte text;
alter table nodere_companies add column if not exists natureza_juridica text;
alter table nodere_companies add column if not exists inscricao_estadual text;
alter table nodere_companies add column if not exists inscricao_municipal text;
alter table nodere_companies add column if not exists telefone_principal text;
alter table nodere_companies add column if not exists telefone_secundario text;
alter table nodere_companies add column if not exists email_principal text;
alter table nodere_companies add column if not exists email_comercial text;
alter table nodere_companies add column if not exists endereco_completo text;
alter table nodere_companies add column if not exists pais text default 'Brasil';
alter table nodere_companies add column if not exists cep text;
alter table nodere_companies add column if not exists resumo text;
alter table nodere_companies add column if not exists contexto text;
alter table nodere_companies add column if not exists produtos_servicos_principais text;
alter table nodere_companies add column if not exists publico_alvo text;
alter table nodere_companies add column if not exists area_atuacao text;
alter table nodere_companies add column if not exists num_funcionarios text;
alter table nodere_companies add column if not exists faturamento_estimado text;
alter table nodere_companies add column if not exists presenca_digital jsonb not null default '{}';
alter table nodere_companies add column if not exists redes_sociais jsonb not null default '{}';
alter table nodere_companies add column if not exists score_comercial integer;
alter table nodere_companies add column if not exists potencial_comercial text;
alter table nodere_companies add column if not exists enrichment_updated_at timestamptz;
alter table nodere_companies add column if not exists custom_fields jsonb not null default '{}';

create table if not exists company_contacts (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references nodere_companies(id) on delete cascade,
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

create table if not exists calendar_events (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text references nodere_companies(id) on delete set null,
  title text not null,
  type text not null default 'follow-up',
  priority text not null default 'medium',
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  assigned_to text,
  created_by text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table calendar_events add column if not exists status text not null default 'pendente';
alter table calendar_events add column if not exists channel text;

create table if not exists catalog_items (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  code text not null,
  name text not null,
  commercial_name text,
  category text not null,
  subcategory text,
  brand text,
  image_url text,
  images text[] not null default '{}',
  type text not null check (type in ('product','service')),
  status text not null default 'active' check (status in ('active','inactive')),
  description_short text not null default '',
  description_full text,
  features text,
  benefits text,
  differentials text,
  target_audience text,
  use_cases text,
  cost numeric not null default 0,
  price numeric not null default 0,
  commission_pct numeric,
  max_discount_pct numeric,
  promotional_price numeric,
  promotion_expires_at date,
  supplier text,
  delivery_days integer,
  warranty text,
  exchange_policy text,
  cancellation_policy text,
  payment_conditions text,
  installments_available integer,
  unit_measure text,
  weight_kg numeric,
  height_cm numeric,
  width_cm numeric,
  length_cm numeric,
  color text,
  material text,
  model text,
  voltage text,
  technical_specs text,
  execution_time text,
  scope text,
  limitations text,
  deliverables text,
  complexity text,
  sla text,
  stock_current integer,
  stock_min integer,
  stock_max integer,
  stock_location text,
  keywords text[] not null default '{}',
  market_segment text,
  campaign_url text,
  support_material_urls text[] not null default '{}',
  registered_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists company_contracts (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references nodere_companies(id) on delete cascade,
  catalog_item_id text not null references catalog_items(id) on delete restrict,
  quantity integer not null default 1,
  contracted_price numeric not null default 0,
  discount_pct numeric,
  contracted_at date not null default current_date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists communications (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references nodere_companies(id) on delete cascade,
  contact_id text references company_contacts(id) on delete set null,
  type text not null check (type in ('whatsapp','email','call','meeting','note','internal','linkedin','instagram')),
  direction text not null check (direction in ('outbound','inbound','manual')),
  subject text,
  body text,
  sent_by text,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  metadata jsonb not null default '{}'
);

create table if not exists message_templates (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  channel text not null default 'whatsapp',
  subject text,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists social_connections (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  platform text not null,
  account_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  platforms text[] not null default '{}',
  start_date date,
  end_date date,
  status text not null default 'draft',
  budget_brl numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  user_id text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists download_logs (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  user_id text,
  file_type text not null,
  file_name text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_company_contacts_company on company_contacts(workspace_id, company_id);
create index if not exists idx_calendar_events_range on calendar_events(workspace_id, start_at, end_at);
create index if not exists idx_catalog_items_workspace on catalog_items(workspace_id, status, category);
create index if not exists idx_company_contracts_company on company_contracts(workspace_id, company_id);
create index if not exists idx_communications_company on communications(workspace_id, company_id, sent_at desc);
create index if not exists idx_message_templates_workspace on message_templates(workspace_id, channel);
create index if not exists idx_social_connections_workspace on social_connections(workspace_id, platform);
create index if not exists idx_campaigns_workspace on campaigns(workspace_id, status);
create index if not exists idx_activity_logs_workspace on activity_logs(workspace_id, created_at desc);
create index if not exists idx_download_logs_workspace on download_logs(workspace_id, created_at desc);


-- Phase 2: custom segments per workspace
alter table nodere_workspaces add column if not exists custom_segments text[] not null default '{}';
alter table workspaces add column if not exists custom_segments text[] not null default '{}';


-- Phase 3: arquivos e logos por empresa
create table if not exists company_files (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references nodere_companies(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_company_files_company on company_files(workspace_id, company_id, created_at desc);



alter table catalog_items add column if not exists image_url text;
alter table catalog_items add column if not exists images text[] not null default '{}';

-- Fase 5: calendario, inbox e marketing persistentes.
alter table calendar_events add column if not exists contact_id text;
alter table calendar_events add column if not exists metadata jsonb not null default '{}';
alter table calendar_events drop constraint if exists calendar_events_type_check;
alter table calendar_events drop constraint if exists calendar_events_priority_check;
alter table calendar_events drop constraint if exists calendar_events_status_check;
alter table calendar_events
  add constraint calendar_events_type_check check (type in ('reuniao','followup','follow-up','meeting','tarefa','task','ligacao','call','interno','internal','postagem','content_post'));
alter table calendar_events
  add constraint calendar_events_priority_check check (priority in ('alta','media','baixa','high','medium','low'));
alter table calendar_events
  add constraint calendar_events_status_check check (status in ('pendente','concluido','cancelado','rascunho','Rascunho'));

alter table inbox_messages add column if not exists company_id text;
alter table inbox_messages add column if not exists contact_id text;
alter table inbox_messages add column if not exists type text not null default 'whatsapp';
alter table inbox_messages add column if not exists subject text;
alter table inbox_messages add column if not exists body text;
alter table inbox_messages add column if not exists flag_color text;
alter table inbox_messages add column if not exists sent_by text;
alter table inbox_messages add column if not exists sent_at timestamptz not null default now();
alter table inbox_messages add column if not exists metadata jsonb not null default '{}';
alter table inbox_messages alter column content drop not null;
alter table inbox_messages drop constraint if exists inbox_messages_direction_check;
alter table inbox_messages drop constraint if exists inbox_messages_type_check;
alter table inbox_messages drop constraint if exists inbox_messages_status_check;
alter table inbox_messages
  add constraint inbox_messages_direction_check check (direction in ('inbound','outbound','manual'));
alter table inbox_messages
  add constraint inbox_messages_type_check check (type in ('whatsapp','email','ligacao','reuniao','interno','manual'));
alter table inbox_messages
  add constraint inbox_messages_status_check check (status in ('unread','read','flagged','resolved'));

alter table message_templates drop constraint if exists message_templates_channel_check;
alter table message_templates
  add constraint message_templates_channel_check check (channel in ('whatsapp','email','linkedin','instagram_dm'));

create index if not exists idx_calendar_events_company on calendar_events(workspace_id, company_id, start_at);
create index if not exists idx_inbox_messages_company on inbox_messages(workspace_id, company_id, created_at desc);

