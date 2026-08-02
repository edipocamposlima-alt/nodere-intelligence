-- NODERE V5 - CRM lifecycle, commercial briefings and unified communications
-- Additive migration. The application API is the only supported data plane;
-- anon/authenticated roles have no direct access to these public tables.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'briefing-attachments',
  'briefing-attachments',
  false,
  5242880,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.nodere_companies
  add column if not exists is_archived boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists record_state text not null default 'active'
    check (record_state in ('active', 'archived', 'trash')),
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists trashed_at timestamptz,
  add column if not exists trashed_by text,
  add column if not exists purge_after timestamptz,
  add column if not exists delete_reason text,
  add column if not exists legal_hold boolean not null default false;

update public.nodere_companies
set record_state = case
  when coalesce(is_deleted, false) then 'trash'
  when coalesce(is_archived, false) then 'archived'
  else coalesce(nullif(record_state, ''), 'active')
end
where coalesce(is_deleted, false)
   or coalesce(is_archived, false)
   or record_state is null
   or record_state = '';

create index if not exists idx_nodere_companies_lifecycle
  on public.nodere_companies(workspace_id, record_state, updated_at desc);

create table if not exists public.commercial_briefings (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  company_id text not null references public.nodere_companies(id) on delete restrict,
  primary_contact_id text references public.company_contacts(id) on delete set null,
  code text not null,
  title text not null default 'Briefing comercial',
  status text not null default 'draft' check (status in ('draft', 'completed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  current_version integer not null default 1 check (current_version > 0),
  answers jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  next_action text,
  next_action_at timestamptz,
  legacy_source text,
  legacy_id text,
  legacy_code text,
  legacy_snapshot jsonb,
  import_batch text,
  source_updated_at timestamptz,
  created_by text not null,
  updated_by text not null,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create index if not exists idx_commercial_briefings_company
  on public.commercial_briefings(workspace_id, company_id, updated_at desc);
create index if not exists idx_commercial_briefings_company_fk
  on public.commercial_briefings(company_id);
create index if not exists idx_commercial_briefings_primary_contact_fk
  on public.commercial_briefings(primary_contact_id)
  where primary_contact_id is not null;
create index if not exists idx_commercial_briefings_queue
  on public.commercial_briefings(workspace_id, status, priority, updated_at desc);
create unique index if not exists idx_commercial_briefings_legacy
  on public.commercial_briefings(workspace_id, legacy_source, legacy_id)
  where legacy_source is not null and legacy_id is not null;

create table if not exists public.briefing_versions (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  briefing_id text not null references public.commercial_briefings(id) on delete restrict,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  change_type text not null default 'manual',
  change_reason text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (briefing_id, version)
);

create index if not exists idx_briefing_versions_lookup
  on public.briefing_versions(workspace_id, briefing_id, version desc);
create index if not exists idx_briefing_versions_briefing_fk
  on public.briefing_versions(briefing_id);

create table if not exists public.briefing_answers (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  briefing_id text not null references public.commercial_briefings(id) on delete restrict,
  field_key text not null,
  value jsonb not null default 'null'::jsonb,
  confidence numeric(5,4),
  source text not null default 'manual',
  original_value jsonb,
  conflict_resolution text check (conflict_resolution in ('keep', 'replace', 'append')),
  updated_by text not null,
  updated_at timestamptz not null default now(),
  unique (briefing_id, field_key)
);

create index if not exists idx_briefing_answers_lookup
  on public.briefing_answers(workspace_id, briefing_id, field_key);
create index if not exists idx_briefing_answers_briefing_fk
  on public.briefing_answers(briefing_id);

create table if not exists public.briefing_field_mappings (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  field_key text not null,
  label text not null,
  section text not null,
  field_type text not null default 'text',
  sort_order integer not null default 0,
  required_for_completion boolean not null default false,
  company_path text,
  contact_path text,
  legacy_keys text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, field_key)
);

create table if not exists public.commercial_briefing_attachments (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  briefing_id text not null references public.commercial_briefings(id) on delete restrict,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  source text not null default 'manual',
  created_by text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create index if not exists idx_briefing_attachments_lookup
  on public.commercial_briefing_attachments(workspace_id, briefing_id, created_at desc);
create index if not exists idx_briefing_attachments_briefing_fk
  on public.commercial_briefing_attachments(briefing_id);

create table if not exists public.nodere_communication_templates (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  name text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'internal')),
  category text,
  subject text,
  body_text text not null default '',
  body_html text not null default '',
  signature text,
  current_version integer not null default 1 check (current_version > 0),
  active boolean not null default true,
  archived_at timestamptz,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nodere_communication_templates
  on public.nodere_communication_templates(workspace_id, channel, active, updated_at desc);

create table if not exists public.communication_template_versions (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  template_id text not null references public.nodere_communication_templates(id) on delete restrict,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  change_reason text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create index if not exists idx_communication_template_versions
  on public.communication_template_versions(workspace_id, template_id, version desc);
create index if not exists idx_communication_template_versions_template_fk
  on public.communication_template_versions(template_id);

create table if not exists public.communication_threads (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  company_id text references public.nodere_companies(id) on delete restrict,
  contact_id text references public.company_contacts(id) on delete set null,
  channel text not null check (channel in ('email', 'whatsapp', 'internal')),
  subject text,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'failed')),
  provider_thread_id text,
  last_event_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_communication_threads_company
  on public.communication_threads(workspace_id, company_id, last_event_at desc nulls last);
create index if not exists idx_communication_threads_company_fk
  on public.communication_threads(company_id)
  where company_id is not null;
create index if not exists idx_communication_threads_contact_fk
  on public.communication_threads(contact_id)
  where contact_id is not null;

create table if not exists public.communication_events (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  thread_id text not null references public.communication_threads(id) on delete restrict,
  company_id text references public.nodere_companies(id) on delete restrict,
  contact_id text references public.company_contacts(id) on delete set null,
  event_type text not null,
  direction text not null check (direction in ('inbound', 'outbound', 'internal')),
  status text not null,
  subject text,
  body_text text not null default '',
  body_html text not null default '',
  attachment_refs jsonb not null default '[]'::jsonb,
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  actor_id text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_communication_events_timeline
  on public.communication_events(workspace_id, thread_id, occurred_at desc);
create index if not exists idx_communication_events_thread_fk
  on public.communication_events(thread_id);
create index if not exists idx_communication_events_company_fk
  on public.communication_events(company_id)
  where company_id is not null;
create index if not exists idx_communication_events_contact_fk
  on public.communication_events(contact_id)
  where contact_id is not null;
create unique index if not exists idx_communication_events_provider
  on public.communication_events(workspace_id, provider_message_id)
  where provider_message_id is not null;

create table if not exists public.communication_outbox (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  thread_id text not null references public.communication_threads(id) on delete restrict,
  company_id text references public.nodere_companies(id) on delete restrict,
  contact_id text references public.company_contacts(id) on delete set null,
  channel text not null check (channel in ('email', 'whatsapp')),
  idempotency_key text not null,
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  provider_message_id text,
  created_by text not null,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_communication_outbox_queue
  on public.communication_outbox(workspace_id, status, next_attempt_at, created_at);
create index if not exists idx_communication_outbox_pending
  on public.communication_outbox(next_attempt_at, created_at)
  where status in ('pending', 'failed');
create index if not exists idx_communication_outbox_thread_fk
  on public.communication_outbox(thread_id);
create index if not exists idx_communication_outbox_company_fk
  on public.communication_outbox(company_id)
  where company_id is not null;
create index if not exists idx_communication_outbox_contact_fk
  on public.communication_outbox(contact_id)
  where contact_id is not null;

create table if not exists public.integration_connections (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  provider text not null,
  status text not null default 'not_configured',
  account_label text,
  encrypted_credentials jsonb,
  scopes text[] not null default '{}',
  last_verified_at timestamptz,
  last_error text,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create table if not exists public.nodere_audit_events (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null,
  actor_id text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_audit_events_entity
  on public.nodere_audit_events(workspace_id, entity_type, entity_id, created_at desc);

update public.nodere_ai_agents
set allowed_tools = (
  select array_agg(distinct tool_name order by tool_name)
  from unnest(allowed_tools || array[
    'briefing_list', 'briefing_get', 'briefing_compare',
    'briefing_create', 'briefing_update', 'briefing_complete',
    'briefing_create_version', 'briefing_archive', 'briefing_restore'
    ,'company_dependencies', 'company_archive', 'company_trash',
    'company_restore', 'company_purge',
    'briefing_generate_pdf', 'briefing_export', 'briefing_import', 'briefing_attach_file',
    'communication_history', 'communication_template_list', 'communication_create_draft'
  ]::text[]) as tool_name
), updated_at = now()
where id = 'commercial-copilot';

update public.nodere_ai_agents
set allowed_tools = (
  select array_agg(distinct tool_name order by tool_name)
  from unnest(allowed_tools || array['briefing_list', 'briefing_get', 'briefing_compare']::text[]) as tool_name
), updated_at = now()
where id in ('prospecting-analyst', 'pipeline-coach', 'proposal-strategist');

create or replace function public.nodere_touch_commercial_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.nodere_reject_immutable_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'NODERE_IMMUTABLE_EVENT';
end;
$$;

drop trigger if exists commercial_briefings_touch_updated_at on public.commercial_briefings;
create trigger commercial_briefings_touch_updated_at
before update on public.commercial_briefings
for each row execute function public.nodere_touch_commercial_updated_at();

drop trigger if exists communication_templates_touch_updated_at on public.nodere_communication_templates;
create trigger communication_templates_touch_updated_at
before update on public.nodere_communication_templates
for each row execute function public.nodere_touch_commercial_updated_at();

drop trigger if exists communication_threads_touch_updated_at on public.communication_threads;
create trigger communication_threads_touch_updated_at
before update on public.communication_threads
for each row execute function public.nodere_touch_commercial_updated_at();

drop trigger if exists communication_outbox_touch_updated_at on public.communication_outbox;
create trigger communication_outbox_touch_updated_at
before update on public.communication_outbox
for each row execute function public.nodere_touch_commercial_updated_at();

drop trigger if exists integration_connections_touch_updated_at on public.integration_connections;
create trigger integration_connections_touch_updated_at
before update on public.integration_connections
for each row execute function public.nodere_touch_commercial_updated_at();

drop trigger if exists communication_events_immutable on public.communication_events;
create trigger communication_events_immutable
before update or delete on public.communication_events
for each row execute function public.nodere_reject_immutable_change();

drop trigger if exists nodere_audit_events_immutable on public.nodere_audit_events;
create trigger nodere_audit_events_immutable
before update or delete on public.nodere_audit_events
for each row execute function public.nodere_reject_immutable_change();

alter table public.commercial_briefings enable row level security;
alter table public.briefing_versions enable row level security;
alter table public.briefing_answers enable row level security;
alter table public.briefing_field_mappings enable row level security;
alter table public.commercial_briefing_attachments enable row level security;
alter table public.nodere_communication_templates enable row level security;
alter table public.communication_template_versions enable row level security;
alter table public.communication_threads enable row level security;
alter table public.communication_events enable row level security;
alter table public.communication_outbox enable row level security;
alter table public.integration_connections enable row level security;
alter table public.nodere_audit_events enable row level security;

alter table public.commercial_briefings force row level security;
alter table public.briefing_versions force row level security;
alter table public.briefing_answers force row level security;
alter table public.briefing_field_mappings force row level security;
alter table public.commercial_briefing_attachments force row level security;
alter table public.nodere_communication_templates force row level security;
alter table public.communication_template_versions force row level security;
alter table public.communication_threads force row level security;
alter table public.communication_events force row level security;
alter table public.communication_outbox force row level security;
alter table public.integration_connections force row level security;
alter table public.nodere_audit_events force row level security;

revoke all on table public.commercial_briefings, public.briefing_versions,
  public.briefing_answers, public.briefing_field_mappings,
  public.commercial_briefing_attachments, public.nodere_communication_templates,
  public.communication_template_versions,
  public.communication_threads, public.communication_events,
  public.communication_outbox, public.integration_connections,
  public.nodere_audit_events from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.commercial_briefings, public.briefing_versions, public.briefing_answers, public.briefing_field_mappings, public.commercial_briefing_attachments, public.nodere_communication_templates, public.communication_template_versions, public.communication_threads, public.communication_events, public.communication_outbox, public.integration_connections, public.nodere_audit_events from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.commercial_briefings, public.briefing_versions, public.briefing_answers, public.briefing_field_mappings, public.commercial_briefing_attachments, public.nodere_communication_templates, public.communication_template_versions, public.communication_threads, public.communication_events, public.communication_outbox, public.integration_connections, public.nodere_audit_events from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update, delete on table public.commercial_briefings, public.briefing_versions, public.briefing_answers, public.briefing_field_mappings, public.commercial_briefing_attachments, public.nodere_communication_templates, public.communication_template_versions, public.communication_threads, public.communication_events, public.communication_outbox, public.integration_connections, public.nodere_audit_events to service_role';
  end if;
end;
$$;

commit;
