-- NODERE - Correcao da homologacao da Fase 1
-- Migração incremental, idempotente e sem exclusao de dados.
-- Aplicar manualmente no Supabase SQL Editor somente apos revisao.

begin;

create extension if not exists pgcrypto;

-- Colunas operacionais usadas pelo backend no schema real.
alter table public.nodere_workspaces add column if not exists onboarding_completed boolean not null default false;
alter table public.nodere_workspaces add column if not exists credits_used integer not null default 0;
alter table public.nodere_workspaces add column if not exists trial_started_at timestamptz default now();
alter table public.nodere_workspaces add column if not exists trial_expires_at timestamptz default (now() + interval '14 days');
alter table public.nodere_workspaces add column if not exists plan_started_at timestamptz;
alter table public.nodere_workspaces add column if not exists plan_renews_at timestamptz;
alter table public.nodere_workspaces add column if not exists custom_segments text[] not null default '{}';
alter table public.nodere_workspaces add column if not exists wl_domain text;
alter table public.nodere_workspaces add column if not exists wl_name text;
alter table public.nodere_workspaces add column if not exists wl_logo_url text;
alter table public.nodere_workspaces add column if not exists wl_primary_color text;
alter table public.nodere_workspaces add column if not exists wl_enabled boolean not null default false;

create index if not exists idx_nodere_workspaces_wl_domain on public.nodere_workspaces(wl_domain);

create table if not exists public.custom_roles (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  name text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  color text not null default '#1E6FDB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

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
  influence_level text,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_contacts add column if not exists linkedin_url text;
alter table public.company_contacts add column if not exists influence_level text;
alter table public.company_contacts add column if not exists notes text;
alter table public.company_contacts add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.company_contacts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.communications (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  contact_id text references public.company_contacts(id) on delete set null,
  type text not null,
  direction text not null,
  subject text,
  body text,
  sent_by text,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.communications add column if not exists contact_id text;
alter table public.communications add column if not exists subject text;
alter table public.communications add column if not exists body text;
alter table public.communications add column if not exists sent_by text;
alter table public.communications add column if not exists sent_at timestamptz not null default now();
alter table public.communications add column if not exists status text not null default 'sent';
alter table public.communications add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.company_contracts (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  catalog_item_id text not null,
  quantity integer not null default 1,
  contracted_price numeric not null default 0,
  discount_pct numeric,
  contracted_at date not null default current_date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_files (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  user_id text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.download_logs (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  user_id text,
  file_type text not null,
  file_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nodere_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  user_id text,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  company_id text references public.nodere_companies(id) on delete cascade,
  insight_type text not null,
  title text,
  content text not null,
  score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodere_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  lead_id text not null,
  title text not null,
  status text not null default 'draft',
  service_type text,
  content text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  valid_until date,
  version integer not null default 1,
  created_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_templates (
  id text primary key default gen_random_uuid()::text,
  workspace_id text,
  service_type text not null,
  name text not null,
  content text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_versions (
  id text primary key default gen_random_uuid()::text,
  lead_id text not null,
  workspace_id text not null default 'default',
  version_number integer not null,
  content text not null,
  service_type text,
  generated_by text not null default 'user',
  created_at timestamptz not null default now(),
  unique (workspace_id, lead_id, version_number)
);

create table if not exists public.inbox_messages (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  lead_id text,
  company_id text,
  contact_id text,
  direction text not null default 'inbound',
  channel text not null default 'whatsapp',
  type text not null default 'whatsapp',
  subject text,
  content text,
  body text,
  status text not null default 'unread',
  flag_color text,
  phone_from text,
  phone_to text,
  sent_by text,
  sent_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inbox_messages add column if not exists company_id text;
alter table public.inbox_messages add column if not exists contact_id text;
alter table public.inbox_messages add column if not exists type text not null default 'whatsapp';
alter table public.inbox_messages add column if not exists subject text;
alter table public.inbox_messages add column if not exists body text;
alter table public.inbox_messages add column if not exists flag_color text;
alter table public.inbox_messages add column if not exists phone_to text;
alter table public.inbox_messages add column if not exists sent_by text;
alter table public.inbox_messages add column if not exists sent_at timestamptz not null default now();
alter table public.inbox_messages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.inbox_messages add column if not exists updated_at timestamptz not null default now();
alter table public.inbox_messages alter column content drop not null;

create table if not exists public.message_templates (
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

create table if not exists public.campaigns (
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

create table if not exists public.social_connections (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  platform text not null,
  provider text,
  account_name text,
  status text not null default 'connected',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_type text,
  scope text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, platform)
);

alter table public.social_connections add column if not exists provider text;
alter table public.social_connections add column if not exists account_name text;
alter table public.social_connections add column if not exists status text not null default 'connected';
alter table public.social_connections add column if not exists access_token_encrypted text;
alter table public.social_connections add column if not exists refresh_token_encrypted text;
alter table public.social_connections add column if not exists token_type text;
alter table public.social_connections add column if not exists scope text;
alter table public.social_connections add column if not exists scopes text[] not null default '{}';
alter table public.social_connections add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.social_connections add column if not exists updated_at timestamptz not null default now();

-- Relacionamentos adicionados como NOT VALID para preservar dados historicos;
-- novos registros ja passam a ser validados, e o legado pode ser saneado depois.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'communications_contact_id_fkey') then
    alter table public.communications
      add constraint communications_contact_id_fkey foreign key (contact_id)
      references public.company_contacts(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'company_contracts_catalog_item_id_fkey')
     and to_regclass('public.catalog_items') is not null then
    alter table public.company_contracts
      add constraint company_contracts_catalog_item_id_fkey foreign key (catalog_item_id)
      references public.catalog_items(id) on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inbox_messages_company_id_fkey') then
    alter table public.inbox_messages
      add constraint inbox_messages_company_id_fkey foreign key (company_id)
      references public.nodere_companies(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inbox_messages_contact_id_fkey') then
    alter table public.inbox_messages
      add constraint inbox_messages_contact_id_fkey foreign key (contact_id)
      references public.company_contacts(id) on delete set null not valid;
  end if;
end
$$;

create index if not exists idx_custom_roles_workspace on public.custom_roles(workspace_id);
create index if not exists idx_company_contacts_company on public.company_contacts(workspace_id, company_id);
create index if not exists idx_communications_company on public.communications(workspace_id, company_id, sent_at desc);
create index if not exists idx_company_contracts_company on public.company_contracts(workspace_id, company_id);
create index if not exists idx_company_files_company on public.company_files(workspace_id, company_id, created_at desc);
create index if not exists idx_activity_logs_workspace on public.activity_logs(workspace_id, created_at desc);
create index if not exists idx_download_logs_workspace on public.download_logs(workspace_id, created_at desc);
create index if not exists idx_nodere_audit_logs_workspace on public.nodere_audit_logs(workspace_id, created_at desc);
create index if not exists idx_intelligence_insights_company on public.intelligence_insights(workspace_id, company_id, created_at desc);
create index if not exists idx_nodere_proposals_workspace on public.nodere_proposals(workspace_id, updated_at desc);
create index if not exists idx_proposal_templates_workspace on public.proposal_templates(workspace_id, service_type);
create index if not exists idx_proposal_versions_lead on public.proposal_versions(workspace_id, lead_id, version_number desc);
create index if not exists idx_inbox_messages_workspace on public.inbox_messages(workspace_id, sent_at desc);
create index if not exists idx_message_templates_workspace on public.message_templates(workspace_id, channel);
create index if not exists idx_campaigns_workspace on public.campaigns(workspace_id, status);
create index if not exists idx_social_connections_workspace on public.social_connections(workspace_id, platform);

create or replace function public.nodere_current_workspace_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  );
$$;

do $$
declare
  table_name text;
  policy_name text;
  workspace_check text;
begin
  foreach table_name in array array[
    'custom_roles', 'company_contacts', 'communications', 'company_contracts',
    'company_files', 'activity_logs', 'download_logs', 'nodere_audit_logs',
    'intelligence_insights', 'nodere_proposals', 'proposal_templates',
    'proposal_versions', 'inbox_messages', 'message_templates', 'campaigns',
    'social_connections'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    workspace_check := case when table_name = 'proposal_templates'
      then '(workspace_id is null or workspace_id = public.nodere_current_workspace_id())'
      else '(workspace_id = public.nodere_current_workspace_id())'
    end;

    policy_name := table_name || '_workspace_select';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = policy_name) then
      execute format('create policy %I on public.%I for select to authenticated using %s', policy_name, table_name, workspace_check);
    end if;

    policy_name := table_name || '_workspace_insert';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = policy_name) then
      execute format('create policy %I on public.%I for insert to authenticated with check (workspace_id = public.nodere_current_workspace_id())', policy_name, table_name);
    end if;

    policy_name := table_name || '_workspace_update';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = policy_name) then
      execute format('create policy %I on public.%I for update to authenticated using (workspace_id = public.nodere_current_workspace_id()) with check (workspace_id = public.nodere_current_workspace_id())', policy_name, table_name);
    end if;

    policy_name := table_name || '_workspace_delete';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = policy_name) then
      execute format('create policy %I on public.%I for delete to authenticated using (workspace_id = public.nodere_current_workspace_id())', policy_name, table_name);
    end if;
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;
