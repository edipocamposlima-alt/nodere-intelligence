begin;

do $$
declare
  relation_name text;
  policy_prefix text;
begin
  foreach relation_name in array array[
    'cadence_enrollments', 'cadence_templates', 'calendar_events',
    'catalog_items', 'nodere_app_settings', 'nodere_companies',
    'nodere_company_notes', 'nodere_discovery_runs',
    'nodere_operator_goals', 'nodere_operators', 'nodere_searches',
    'nodere_workspace_settings', 'push_subscriptions'
  ]
  loop
    policy_prefix := 'v8_' || relation_name || '_workspace';
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_select', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_insert', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_update', relation_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_delete', relation_name);
  end loop;
end
$$;

drop policy if exists v8_workspaces_select on public.nodere_workspaces;
drop policy if exists v8_ai_model_registry_select on public.nodere_ai_model_registry;
drop policy if exists v8_plan_limits_select on public.nodere_plan_limits;
drop policy if exists v8_vertical_prompts_select on public.vertical_prompts;

-- Grants are intentionally not broadened by rollback. Restoring TRUNCATE,
-- provider secrets or financial mutation to browser roles is never safe.
commit;
