begin;

-- V8: reconcile the Data API security boundary with the canonical platform
-- identity. The backend keeps privileged access through service_role; browser
-- sessions only receive the minimum workspace-scoped grants declared below.

create schema if not exists nodere_private;
revoke all on schema nodere_private from public, anon;
grant usage on schema nodere_private to authenticated, service_role;

create or replace function nodere_private.current_user_workspace_ids()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct workspace_id), array[]::text[])
  from public.nodere_platform_users
  where (select auth.uid()) is not null
    and active is true
    and coalesce(status, 'active') = 'active'
    and (
      auth_user_id = (select auth.uid())
      or id = (select auth.uid())::text
    )
$$;

create or replace function nodere_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text
  from public.nodere_platform_users
  where (select auth.uid()) is not null
    and active is true
    and coalesce(status, 'active') = 'active'
    and (
      auth_user_id = (select auth.uid())
      or id = (select auth.uid())::text
    )
  limit 1
$$;

revoke all on function nodere_private.current_user_workspace_ids() from public, anon;
revoke all on function nodere_private.current_user_role() from public, anon;
grant execute on function nodere_private.current_user_workspace_ids() to authenticated, service_role;
grant execute on function nodere_private.current_user_role() to authenticated, service_role;

revoke execute on function public.nodere_current_workspace_id() from public, anon;
grant execute on function public.nodere_current_workspace_id() to authenticated, service_role;

-- RLS does not protect TRUNCATE, and browser roles never need schema-level
-- privileges. Remove every privilege outside ordinary row DML globally.
do $$
declare
  relation_name text;
begin
  for relation_name in
    select quote_ident(n.nspname) || '.' || quote_ident(c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke truncate, references, trigger on table %s from authenticated',
      relation_name
    );
  end loop;
end
$$;

-- Deprecated, provider-owned and financially sensitive relations remain
-- backend-only. In particular, no authenticated client can mutate credit,
-- entitlement, billing, audit, auth identity or integration-secret records.
revoke all on table
  public.api_keys,
  public.mvp_ai_memory,
  public.mvp_crm_events,
  public.mvp_diagnoses,
  public.mvp_leads,
  public.mvp_notes,
  public.mvp_notifications,
  public.mvp_searches,
  public.mvp_site_scans,
  public.mvp_tasks,
  public.nodere_ai_agents,
  public.nodere_ai_conversations,
  public.nodere_ai_executions,
  public.nodere_ai_messages,
  public.nodere_ai_tool_receipts,
  public.nodere_audit_events,
  public.nodere_billing_subscriptions,
  public.nodere_credit_ledger,
  public.nodere_credit_wallets,
  public.nodere_domain_events,
  public.nodere_owner_entitlements,
  public.nodere_platform_users,
  public.nodere_stripe_events,
  public.nodere_test_data_registry
from anon, authenticated;

-- Relations intentionally served only by the authenticated backend keep their
-- existing service_role access. Their lack of a browser policy is deliberate.
revoke all on table
  public.briefing_answers,
  public.briefing_field_mappings,
  public.briefing_versions,
  public.commercial_briefing_attachments,
  public.commercial_briefings,
  public.communication_events,
  public.communication_outbox,
  public.communication_template_versions,
  public.communication_threads,
  public.integration_connections,
  public.nodere_communication_templates,
  public.nodere_research_runs
from anon, authenticated;

-- Ordinary workspace data that is valid for direct Supabase clients. The API
-- continues to be the primary access path, while RLS now gives authenticated
-- sessions a correct and independently testable isolation boundary.
do $$
declare
  relation_name text;
  policy_prefix text;
begin
  foreach relation_name in array array[
    'cadence_enrollments',
    'cadence_templates',
    'calendar_events',
    'catalog_items',
    'nodere_app_settings',
    'nodere_companies',
    'nodere_company_notes',
    'nodere_discovery_runs',
    'nodere_operator_goals',
    'nodere_operators',
    'nodere_searches',
    'nodere_workspace_settings',
    'push_subscriptions'
  ]
  loop
    policy_prefix := 'v8_' || relation_name || '_workspace';

    execute format('alter table public.%I enable row level security', relation_name);
    execute format('alter table public.%I force row level security', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_select', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_insert', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_update', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_delete', relation_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using (workspace_id::text = any (nodere_private.current_user_workspace_ids()))',
      policy_prefix || '_select', relation_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (workspace_id::text = any (nodere_private.current_user_workspace_ids()))',
      policy_prefix || '_insert', relation_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (workspace_id::text = any (nodere_private.current_user_workspace_ids())) with check (workspace_id::text = any (nodere_private.current_user_workspace_ids()))',
      policy_prefix || '_update', relation_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (workspace_id::text = any (nodere_private.current_user_workspace_ids()))',
      policy_prefix || '_delete', relation_name
    );

    execute format('revoke all on table public.%I from anon, authenticated', relation_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', relation_name);
  end loop;
end
$$;

-- Workspace metadata is readable but remains backend-managed so a browser
-- cannot self-assign credits, plans, owner identity or billing dates.
alter table public.nodere_workspaces enable row level security;
alter table public.nodere_workspaces force row level security;
drop policy if exists v8_workspaces_select on public.nodere_workspaces;
create policy v8_workspaces_select
on public.nodere_workspaces
for select
to authenticated
using (id = any (nodere_private.current_user_workspace_ids()));
revoke all on table public.nodere_workspaces from anon, authenticated;
grant select on table public.nodere_workspaces to authenticated;

-- Non-secret registries are globally readable only after authentication.
alter table public.nodere_ai_model_registry enable row level security;
alter table public.nodere_plan_limits enable row level security;
alter table public.vertical_prompts enable row level security;

drop policy if exists v8_ai_model_registry_select on public.nodere_ai_model_registry;
create policy v8_ai_model_registry_select
on public.nodere_ai_model_registry for select to authenticated
using (enabled is true and provider_available is true);

drop policy if exists v8_plan_limits_select on public.nodere_plan_limits;
create policy v8_plan_limits_select
on public.nodere_plan_limits for select to authenticated
using (true);

drop policy if exists v8_vertical_prompts_select on public.vertical_prompts;
create policy v8_vertical_prompts_select
on public.vertical_prompts for select to authenticated
using (true);

revoke all on table
  public.nodere_ai_model_registry,
  public.nodere_plan_limits,
  public.vertical_prompts
from anon, authenticated;
grant select on table
  public.nodere_ai_model_registry,
  public.nodere_plan_limits,
  public.vertical_prompts
to authenticated;

commit;
