begin;

drop index if exists public.company_files_workspace_company_active_idx;
alter table public.company_files
  drop column if exists deleted_by,
  drop column if exists deleted_at;

commit;
