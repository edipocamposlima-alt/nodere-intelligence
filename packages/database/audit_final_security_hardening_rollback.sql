-- Rollback pareado de audit_final_security_hardening.sql.
-- Restaura exatamente os helpers publicos e as policies anteriores observadas em producao.

begin;

select pg_advisory_xact_lock(hashtext('nodere:audit_final_security_hardening'));

create or replace function public.nodere_current_user_role()
returns text
language sql
stable
security definer
as $$
  select role
  from public.nodere_platform_users
  where auth_user_id = auth.uid()
     or id = auth.uid()::text
  limit 1
$$;

create or replace function public.nodere_current_user_workspace_ids()
returns text[]
language sql
stable
security definer
as $$
  select coalesce(array_agg(workspace_id), array[]::text[])
  from public.nodere_platform_users
  where auth_user_id = auth.uid()
     or id = auth.uid()::text
$$;

grant execute on function public.nodere_current_user_role() to public, anon, authenticated, service_role;
grant execute on function public.nodere_current_user_workspace_ids() to public, anon, authenticated, service_role;

create or replace function public.nodere_current_workspace_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
$$;

drop policy if exists nodere_catalog_read_workspace on public.nodere_commercial_catalog_items;
create policy nodere_catalog_read_workspace on public.nodere_commercial_catalog_items
for select using (workspace_id = any(public.nodere_current_user_workspace_ids()));

drop policy if exists nodere_catalog_write_admin_owner on public.nodere_commercial_catalog_items;
drop policy if exists nodere_catalog_insert_admin_owner on public.nodere_commercial_catalog_items;
drop policy if exists nodere_catalog_update_admin_owner on public.nodere_commercial_catalog_items;
drop policy if exists nodere_catalog_delete_admin_owner on public.nodere_commercial_catalog_items;
create policy nodere_catalog_write_admin_owner on public.nodere_commercial_catalog_items
for all
using (
  workspace_id = any(public.nodere_current_user_workspace_ids())
  and public.nodere_current_user_role() = any(array['admin'::text, 'owner'::text])
)
with check (
  workspace_id = any(public.nodere_current_user_workspace_ids())
  and public.nodere_current_user_role() = any(array['admin'::text, 'owner'::text])
);

drop policy if exists nodere_proposal_audit_workspace on public.nodere_proposal_audit_logs;
create policy nodere_proposal_audit_workspace on public.nodere_proposal_audit_logs
for select using (workspace_id = any(public.nodere_current_user_workspace_ids()));

drop policy if exists nodere_proposal_items_read_workspace on public.nodere_proposal_items;
create policy nodere_proposal_items_read_workspace on public.nodere_proposal_items
for select using (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any(public.nodere_current_user_workspace_ids())
  )
);

drop policy if exists nodere_proposal_items_write_workspace on public.nodere_proposal_items;
drop policy if exists nodere_proposal_items_insert_workspace on public.nodere_proposal_items;
drop policy if exists nodere_proposal_items_update_workspace on public.nodere_proposal_items;
drop policy if exists nodere_proposal_items_delete_workspace on public.nodere_proposal_items;
create policy nodere_proposal_items_write_workspace on public.nodere_proposal_items
for all
using (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any(public.nodere_current_user_workspace_ids())
  )
  and public.nodere_current_user_role() = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
)
with check (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any(public.nodere_current_user_workspace_ids())
  )
  and public.nodere_current_user_role() = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
);

drop policy if exists nodere_proposals_read_workspace on public.nodere_proposals;
create policy nodere_proposals_read_workspace on public.nodere_proposals
for select using (workspace_id = any(public.nodere_current_user_workspace_ids()));

drop policy if exists nodere_proposals_workspace_select on public.nodere_proposals;
create policy nodere_proposals_workspace_select on public.nodere_proposals
for select to authenticated
using (workspace_id = public.nodere_current_workspace_id());

drop policy if exists nodere_proposals_write_workspace on public.nodere_proposals;
drop policy if exists nodere_proposals_insert_workspace on public.nodere_proposals;
drop policy if exists nodere_proposals_update_workspace on public.nodere_proposals;
drop policy if exists nodere_proposals_delete_workspace on public.nodere_proposals;
create policy nodere_proposals_write_workspace on public.nodere_proposals
for all
using (
  workspace_id = any(public.nodere_current_user_workspace_ids())
  and public.nodere_current_user_role() = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
)
with check (
  workspace_id = any(public.nodere_current_user_workspace_ids())
  and public.nodere_current_user_role() = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
);

drop policy if exists nodere_proposals_workspace_insert on public.nodere_proposals;
create policy nodere_proposals_workspace_insert on public.nodere_proposals
for insert to authenticated
with check (workspace_id = public.nodere_current_workspace_id());

drop policy if exists nodere_proposals_workspace_update on public.nodere_proposals;
create policy nodere_proposals_workspace_update on public.nodere_proposals
for update to authenticated
using (workspace_id = public.nodere_current_workspace_id())
with check (workspace_id = public.nodere_current_workspace_id());

drop policy if exists nodere_proposals_workspace_delete on public.nodere_proposals;
create policy nodere_proposals_workspace_delete on public.nodere_proposals
for delete to authenticated
using (workspace_id = public.nodere_current_workspace_id());

drop policy if exists nodere_discovery_runs_service_role_all on public.nodere_discovery_runs;
create policy nodere_discovery_runs_service_role_all on public.nodere_discovery_runs
for all to public
using (auth.role() = 'service_role'::text)
with check (auth.role() = 'service_role'::text);

alter function public.nodere_touch_updated_at() reset search_path;
alter function public.nodere_validate_proposal_item() reset search_path;
alter function public.nodere_recalculate_proposal_totals() reset search_path;
alter function public.nodere_recalculate_current_proposal() reset search_path;

grant execute on function public.rls_auto_enable() to public;

drop function if exists nodere_private.current_user_role();
drop function if exists nodere_private.current_user_workspace_ids();
drop schema if exists nodere_private;
drop index if exists public.idx_nodere_platform_users_auth_user_id;

notify pgrst, 'reload schema';

commit;
