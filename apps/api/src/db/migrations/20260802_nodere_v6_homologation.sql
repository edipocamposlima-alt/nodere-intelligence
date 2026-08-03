begin;

alter table public.nodere_platform_users
  add column if not exists custom_role_id text,
  add column if not exists status text not null default 'active',
  add column if not exists last_active_at timestamptz,
  add column if not exists visibility_level text not null default 'read_edit',
  add column if not exists module_permissions jsonb not null default '{}'::jsonb;

update public.nodere_platform_users
set
  status = case when active then coalesce(nullif(status, ''), 'active') else 'inactive' end,
  visibility_level = case when role = 'owner' then 'full' when role = 'viewer' then 'read' else coalesce(nullif(visibility_level, ''), 'read_edit') end,
  module_permissions = coalesce(module_permissions, '{}'::jsonb),
  updated_at = now()
where status is null
   or status = ''
   or visibility_level is null
   or visibility_level = ''
   or module_permissions is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nodere_platform_users_custom_role_fk') then
    alter table public.nodere_platform_users
      add constraint nodere_platform_users_custom_role_fk
      foreign key (custom_role_id) references public.custom_roles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nodere_platform_users_status_check') then
    alter table public.nodere_platform_users
      add constraint nodere_platform_users_status_check
      check (status in ('active', 'inactive', 'invited', 'restricted'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nodere_platform_users_visibility_check') then
    alter table public.nodere_platform_users
      add constraint nodere_platform_users_visibility_check
      check (visibility_level in ('full', 'read_edit', 'read'));
  end if;
end $$;

create index if not exists idx_platform_users_workspace_status
  on public.nodere_platform_users(workspace_id, status, active);
create index if not exists idx_platform_users_custom_role
  on public.nodere_platform_users(workspace_id, custom_role_id)
  where custom_role_id is not null;

alter table public.nodere_platform_users enable row level security;
alter table public.nodere_platform_users force row level security;
alter table public.custom_roles enable row level security;
alter table public.custom_roles force row level security;

revoke all on table public.nodere_platform_users from anon, authenticated;
revoke all on table public.custom_roles from anon, authenticated;

commit;
