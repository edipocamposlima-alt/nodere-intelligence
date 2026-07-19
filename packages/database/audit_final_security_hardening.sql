-- NODERE - auditoria final: endurecimento de funcoes e RLS.
-- Pre-requisitos: snapshot/backup confirmado, janela de manutencao e validacao em staging.
-- Nao executar parcialmente. O bloco e transacional e possui rollback pareado.

begin;

select pg_advisory_xact_lock(hashtext('nodere:audit_final_security_hardening'));

do $$
begin
  if exists (
    select 1
    from public.nodere_platform_users
    where auth_user_id is not null
    group by auth_user_id
    having count(*) > 1
  ) then
    raise exception 'Abortado: auth_user_id duplicado em nodere_platform_users.';
  end if;
end
$$;

create unique index if not exists idx_nodere_platform_users_auth_user_id
  on public.nodere_platform_users(auth_user_id)
  where auth_user_id is not null;

create schema if not exists nodere_private;
revoke all on schema nodere_private from public, anon;
grant usage on schema nodere_private to authenticated, service_role;

create or replace function nodere_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text
  from public.nodere_platform_users
  where active is true
    and (
      auth_user_id = (select auth.uid())
      or id = (select auth.uid())::text
    )
  limit 1
$$;

create or replace function nodere_private.current_user_workspace_ids()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct workspace_id), array[]::text[])
  from public.nodere_platform_users
  where active is true
    and (
      auth_user_id = (select auth.uid())
      or id = (select auth.uid())::text
    )
$$;

revoke all on function nodere_private.current_user_role() from public, anon;
revoke all on function nodere_private.current_user_workspace_ids() from public, anon;
grant execute on function nodere_private.current_user_role() to authenticated, service_role;
grant execute on function nodere_private.current_user_workspace_ids() to authenticated, service_role;

drop policy if exists nodere_catalog_read_workspace on public.nodere_commercial_catalog_items;
create policy nodere_catalog_read_workspace
on public.nodere_commercial_catalog_items
for select to authenticated
using (workspace_id = any((select nodere_private.current_user_workspace_ids())));

drop policy if exists nodere_catalog_write_admin_owner on public.nodere_commercial_catalog_items;
create policy nodere_catalog_write_admin_owner
on public.nodere_commercial_catalog_items
for all to authenticated
using (
  workspace_id = any((select nodere_private.current_user_workspace_ids()))
  and (select nodere_private.current_user_role()) = any(array['admin'::text, 'owner'::text])
)
with check (
  workspace_id = any((select nodere_private.current_user_workspace_ids()))
  and (select nodere_private.current_user_role()) = any(array['admin'::text, 'owner'::text])
);

drop policy if exists nodere_proposal_audit_workspace on public.nodere_proposal_audit_logs;
create policy nodere_proposal_audit_workspace
on public.nodere_proposal_audit_logs
for select to authenticated
using (workspace_id = any((select nodere_private.current_user_workspace_ids())));

drop policy if exists nodere_proposal_items_read_workspace on public.nodere_proposal_items;
create policy nodere_proposal_items_read_workspace
on public.nodere_proposal_items
for select to authenticated
using (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any((select nodere_private.current_user_workspace_ids()))
  )
);

drop policy if exists nodere_proposal_items_write_workspace on public.nodere_proposal_items;
create policy nodere_proposal_items_write_workspace
on public.nodere_proposal_items
for all to authenticated
using (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any((select nodere_private.current_user_workspace_ids()))
  )
  and (select nodere_private.current_user_role()) = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
)
with check (
  proposal_id in (
    select id from public.nodere_proposals
    where workspace_id = any((select nodere_private.current_user_workspace_ids()))
  )
  and (select nodere_private.current_user_role()) = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
);

drop policy if exists nodere_proposals_read_workspace on public.nodere_proposals;
create policy nodere_proposals_read_workspace
on public.nodere_proposals
for select to authenticated
using (workspace_id = any((select nodere_private.current_user_workspace_ids())));

drop policy if exists nodere_proposals_write_workspace on public.nodere_proposals;
create policy nodere_proposals_write_workspace
on public.nodere_proposals
for all to authenticated
using (
  workspace_id = any((select nodere_private.current_user_workspace_ids()))
  and (select nodere_private.current_user_role()) = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
)
with check (
  workspace_id = any((select nodere_private.current_user_workspace_ids()))
  and (select nodere_private.current_user_role()) = any(array['operator'::text, 'manager'::text, 'admin'::text, 'owner'::text])
);

drop function if exists public.nodere_current_user_role();
drop function if exists public.nodere_current_user_workspace_ids();

alter function public.nodere_current_workspace_id() set search_path = '';
alter function public.nodere_touch_updated_at() set search_path = '';
alter function public.nodere_validate_proposal_item() set search_path = '';
alter function public.nodere_recalculate_proposal_totals() set search_path = '';
alter function public.nodere_recalculate_current_proposal() set search_path = '';

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
