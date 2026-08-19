begin;

create unique index if not exists nodere_platform_users_one_active_owner_per_workspace
  on public.nodere_platform_users (workspace_id)
  where role = 'owner' and active is true;

commit;
