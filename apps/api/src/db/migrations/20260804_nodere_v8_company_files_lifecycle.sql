begin;

alter table public.company_files
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

create index if not exists company_files_workspace_company_active_idx
  on public.company_files (workspace_id, company_id, created_at desc)
  where deleted_at is null;

commit;
