begin;

alter table public.company_files
  add column if not exists sha256 text;

alter table public.company_files
  drop constraint if exists company_files_sha256_format_check;

alter table public.company_files
  add constraint company_files_sha256_format_check
  check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$');

commit;
