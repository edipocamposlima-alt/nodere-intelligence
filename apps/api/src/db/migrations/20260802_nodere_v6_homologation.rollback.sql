-- Emergency rollback for the V6 profile extension.
-- Run only after disabling V6 sessions and exporting nodere_platform_users.
begin;

drop index if exists public.idx_platform_users_custom_role;
drop index if exists public.idx_platform_users_workspace_status;

alter table public.nodere_platform_users
  drop constraint if exists nodere_platform_users_custom_role_fk,
  drop constraint if exists nodere_platform_users_status_check,
  drop constraint if exists nodere_platform_users_visibility_check,
  drop column if exists module_permissions,
  drop column if exists visibility_level,
  drop column if exists last_active_at,
  drop column if exists status,
  drop column if exists custom_role_id;

commit;
