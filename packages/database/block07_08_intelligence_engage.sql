-- NODERE Nexus - BLOCO 07/08 Intelligence + Engage
-- SQL incremental seguro para o schema real existente.
-- Nao cria tabelas users/workspaces/leads paralelas.

create extension if not exists pgcrypto;

create table if not exists public.nodere_ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  user_id text,
  module text not null,
  tokens_used integer default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.nodere_lead_enrichments (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text not null references public.nodere_companies(id) on delete cascade,
  source text not null,
  raw_data jsonb not null default '{}',
  email text,
  phone_direct text,
  linkedin_url text,
  revenue_range text,
  employee_count text,
  founded_year integer,
  cnpj_status text,
  cnpj_abertura text,
  socios jsonb,
  cnae_principal text,
  enriched_at timestamptz not null default now(),
  unique (workspace_id, company_id, source)
);

create table if not exists public.nodere_lead_diagnostics (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text not null references public.nodere_companies(id) on delete cascade,
  summary text,
  pains jsonb not null default '[]',
  needs jsonb not null default '[]',
  recommended_product text,
  propensity text,
  approach_tip text,
  raw_prompt text,
  generated_at timestamptz not null default now(),
  unique (workspace_id, company_id)
);

create table if not exists public.nodere_growth_radar_alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text references public.nodere_companies(id) on delete cascade,
  alert_type text,
  message text,
  delta jsonb not null default '{}',
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text references public.nodere_companies(id) on delete set null,
  contact_name text,
  contact_phone text not null,
  assigned_to text,
  unread_count integer not null default 0,
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, contact_phone)
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade,
  wamid text unique,
  direction text not null,
  body text not null,
  status text not null default 'sent',
  sent_by text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

alter table public.campaigns add column if not exists type text default 'social';
alter table public.campaigns add column if not exists template text;
alter table public.campaigns add column if not exists total_recipients integer not null default 0;
alter table public.campaigns add column if not exists sent_count integer not null default 0;
alter table public.campaigns add column if not exists failed_count integer not null default 0;
alter table public.campaigns add column if not exists started_at timestamptz;
alter table public.campaigns add column if not exists finished_at timestamptz;

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  company_id text references public.nodere_companies(id) on delete set null,
  phone text,
  variables jsonb not null default '{}',
  status text not null default 'pending',
  error_msg text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  name text not null,
  trigger_stage text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.email_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  sequence_id uuid references public.email_sequences(id) on delete cascade,
  step_number integer not null,
  delay_days integer not null default 0,
  subject text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  name text not null,
  active boolean not null default true,
  trigger_type text not null,
  trigger_config jsonb not null default '{}',
  action_type text not null,
  action_config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_ai_usage_workspace on public.nodere_ai_usage_log(workspace_id, created_at desc);
create index if not exists idx_nodere_enrichments_company on public.nodere_lead_enrichments(workspace_id, company_id, enriched_at desc);
create index if not exists idx_nodere_diagnostics_company on public.nodere_lead_diagnostics(workspace_id, company_id);
create index if not exists idx_nodere_growth_alerts_workspace on public.nodere_growth_radar_alerts(workspace_id, seen, created_at desc);
create index if not exists idx_whatsapp_conversations_workspace on public.whatsapp_conversations(workspace_id, last_message_at desc);
create index if not exists idx_whatsapp_messages_conversation on public.whatsapp_messages(workspace_id, conversation_id, created_at);
create index if not exists idx_campaign_recipients_campaign on public.campaign_recipients(workspace_id, campaign_id, status);
create index if not exists idx_automations_workspace on public.automations(workspace_id, active, trigger_type);

create or replace function public.increment_unread(conv_id uuid)
returns void
language sql
as $$
  update public.whatsapp_conversations
  set unread_count = unread_count + 1,
      updated_at = now()
  where id = conv_id;
$$;

create or replace function public.increment_campaign_sent(cid uuid)
returns void
language sql
as $$
  update public.campaigns
  set sent_count = sent_count + 1
  where id = cid;
$$;

alter table public.nodere_ai_usage_log enable row level security;
alter table public.nodere_lead_enrichments enable row level security;
alter table public.nodere_lead_diagnostics enable row level security;
alter table public.nodere_growth_radar_alerts enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_sequence_steps enable row level security;
alter table public.automations enable row level security;
