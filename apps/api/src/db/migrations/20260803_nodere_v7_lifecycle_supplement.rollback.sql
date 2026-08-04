drop index if exists public.commercial_briefings_deleted_idx;
alter table public.commercial_briefings
  drop column if exists legal_hold,
  drop column if exists deletion_batch_id,
  drop column if exists restore_count,
  drop column if exists purged_by,
  drop column if exists purged_at,
  drop column if exists retention_until,
  drop column if exists deletion_reason,
  drop column if exists deleted_by,
  drop column if exists deleted_at,
  drop column if exists is_deleted;

drop index if exists public.nodere_companies_retention_idx;
alter table public.nodere_companies
  drop column if exists deletion_batch_id,
  drop column if exists restore_count,
  drop column if exists purged_by,
  drop column if exists purged_at,
  drop column if exists retention_until,
  drop column if exists deletion_reason,
  drop column if exists deleted_by;
