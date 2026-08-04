-- NODERE V7 - complete, auditable lifecycle metadata for companies and briefings.

alter table public.nodere_companies
  add column if not exists deleted_by text,
  add column if not exists deletion_reason text,
  add column if not exists retention_until timestamptz,
  add column if not exists purged_at timestamptz,
  add column if not exists purged_by text,
  add column if not exists restore_count integer not null default 0 check (restore_count >= 0),
  add column if not exists deletion_batch_id text;

update public.nodere_companies
set deleted_at = coalesce(deleted_at, trashed_at),
    deleted_by = coalesce(deleted_by, trashed_by),
    deletion_reason = coalesce(deletion_reason, delete_reason),
    retention_until = coalesce(retention_until, purge_after)
where coalesce(is_deleted, false) or record_state = 'trash';

create index if not exists nodere_companies_retention_idx
  on public.nodere_companies(workspace_id, retention_until)
  where record_state = 'trash';

alter table public.commercial_briefings
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deletion_reason text,
  add column if not exists retention_until timestamptz,
  add column if not exists purged_at timestamptz,
  add column if not exists purged_by text,
  add column if not exists restore_count integer not null default 0 check (restore_count >= 0),
  add column if not exists deletion_batch_id text,
  add column if not exists legal_hold boolean not null default false;

create index if not exists commercial_briefings_deleted_idx
  on public.commercial_briefings(workspace_id, is_deleted, retention_until, updated_at desc);

comment on column public.nodere_companies.deletion_batch_id is
  'Optional deterministic test or administrative deletion batch identifier.';
comment on column public.commercial_briefings.is_deleted is
  'Logical deletion flag; content and dependencies remain recoverable until an authorized purge.';
