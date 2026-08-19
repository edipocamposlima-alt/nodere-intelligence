begin;

alter table public.company_files
  drop constraint if exists company_files_sha256_format_check,
  drop column if exists sha256;

commit;
