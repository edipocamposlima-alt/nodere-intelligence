-- NODERE V8 - private pre-change snapshot
-- Captures production data before any V8 structural correction.
-- The backup schema is not exposed through the Supabase Data API.

begin;

create schema if not exists nodere_v8_backup;
revoke all on schema nodere_v8_backup from public, anon, authenticated;

create table if not exists nodere_v8_backup.auth_users_metadata as
select
  id,
  email,
  raw_app_meta_data,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
from auth.users
with no data;

insert into nodere_v8_backup.auth_users_metadata
select
  id,
  email,
  raw_app_meta_data,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
from auth.users source
where not exists (
  select 1
  from nodere_v8_backup.auth_users_metadata snapshot
  where snapshot.id = source.id
);

create table if not exists nodere_v8_backup.nodere_platform_users as
select
  id,
  workspace_id,
  name,
  email,
  role,
  active,
  created_at,
  updated_at,
  auth_user_id,
  legacy_id,
  legacy_workspace_id,
  auth_imported_at,
  auth_import_error,
  custom_role_id,
  status,
  last_active_at,
  visibility_level,
  module_permissions
from public.nodere_platform_users
with no data;

insert into nodere_v8_backup.nodere_platform_users
select
  source.id,
  source.workspace_id,
  source.name,
  source.email,
  source.role,
  source.active,
  source.created_at,
  source.updated_at,
  source.auth_user_id,
  source.legacy_id,
  source.legacy_workspace_id,
  source.auth_imported_at,
  source.auth_import_error,
  source.custom_role_id,
  source.status,
  source.last_active_at,
  source.visibility_level,
  source.module_permissions
from public.nodere_platform_users source
where not exists (
  select 1
  from nodere_v8_backup.nodere_platform_users snapshot
  where snapshot.id = source.id
);

do $$
declare
  table_name text;
  tables_to_snapshot constant text[] := array[
    'nodere_workspaces',
    'nodere_companies',
    'nodere_company_notes',
    'nodere_operators',
    'nodere_owner_entitlements',
    'nodere_credit_wallets',
    'nodere_credit_ledger',
    'nodere_ai_model_registry',
    'nodere_ai_agents',
    'nodere_ai_conversations',
    'nodere_ai_messages',
    'nodere_ai_executions',
    'nodere_ai_tool_receipts',
    'nodere_proposals',
    'nodere_proposal_items',
    'nodere_proposal_audit_logs',
    'proposal_versions',
    'proposal_templates',
    'catalog_items',
    'nodere_commercial_catalog_items',
    'commercial_briefings',
    'briefing_versions',
    'briefing_answers',
    'communications',
    'communication_threads',
    'communication_events',
    'communication_outbox',
    'nodere_communication_templates',
    'communication_template_versions',
    'calendar_events',
    'custom_roles',
    'nodere_test_data_registry'
  ];
begin
  foreach table_name in array tables_to_snapshot loop
    if to_regclass(format('public.%I', table_name)) is not null
       and to_regclass(format('nodere_v8_backup.%I', table_name)) is null then
      execute format(
        'create table nodere_v8_backup.%I as table public.%I',
        table_name,
        table_name
      );
    end if;
  end loop;
end
$$;

create table if not exists nodere_v8_backup.snapshot_manifest (
  snapshot_id text primary key,
  created_at timestamptz not null default now(),
  project_ref text not null,
  canonical_workspace_id text not null,
  canonical_owner_user_id uuid not null,
  counts jsonb not null,
  companies_id_checksum text not null,
  companies_row_checksum text not null,
  notes_id_checksum text not null,
  notes_row_checksum text not null
);

insert into nodere_v8_backup.snapshot_manifest (
  snapshot_id,
  project_ref,
  canonical_workspace_id,
  canonical_owner_user_id,
  counts,
  companies_id_checksum,
  companies_row_checksum,
  notes_id_checksum,
  notes_row_checksum
)
select
  'nodere_v8_prechange_20260804',
  'qhopjggnbzewuuktqntp',
  'default',
  '3e266c48-8599-4604-873b-3d832875cd24'::uuid,
  jsonb_build_object(
    'auth_users', (select count(*) from nodere_v8_backup.auth_users_metadata),
    'workspaces', (select count(*) from nodere_v8_backup.nodere_workspaces),
    'platform_users', (select count(*) from nodere_v8_backup.nodere_platform_users),
    'companies_total', (select count(*) from nodere_v8_backup.nodere_companies),
    'companies_default_active', (
      select count(*)
      from nodere_v8_backup.nodere_companies
      where workspace_id = 'default'
        and coalesce(record_state, 'active') = 'active'
        and coalesce(is_deleted, false) = false
    ),
    'company_notes', (select count(*) from nodere_v8_backup.nodere_company_notes),
    'owner_entitlements', (select count(*) from nodere_v8_backup.nodere_owner_entitlements),
    'wallets', (select count(*) from nodere_v8_backup.nodere_credit_wallets),
    'ledger_entries', (select count(*) from nodere_v8_backup.nodere_credit_ledger),
    'proposals', (select count(*) from nodere_v8_backup.nodere_proposals),
    'briefings', (select count(*) from nodere_v8_backup.commercial_briefings),
    'calendar_events', (select count(*) from nodere_v8_backup.calendar_events)
  ),
  (select md5(string_agg(id, '|' order by id)) from nodere_v8_backup.nodere_companies),
  (select md5(string_agg(md5(to_jsonb(row_data)::text), '|' order by id)) from nodere_v8_backup.nodere_companies row_data),
  (select md5(string_agg(id, '|' order by id)) from nodere_v8_backup.nodere_company_notes),
  (select md5(string_agg(md5(to_jsonb(row_data)::text), '|' order by id)) from nodere_v8_backup.nodere_company_notes row_data)
where not exists (
  select 1
  from nodere_v8_backup.snapshot_manifest
  where snapshot_id = 'nodere_v8_prechange_20260804'
);

revoke all on all tables in schema nodere_v8_backup from public, anon, authenticated;

commit;
