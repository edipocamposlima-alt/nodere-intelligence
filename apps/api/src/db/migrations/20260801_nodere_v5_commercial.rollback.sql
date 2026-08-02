-- NODERE V5 commercial rollback. Execute only after a verified backup and
-- only if no production records need to be preserved.

begin;

drop trigger if exists nodere_audit_events_immutable on public.nodere_audit_events;
drop trigger if exists communication_events_immutable on public.communication_events;
drop trigger if exists integration_connections_touch_updated_at on public.integration_connections;
drop trigger if exists communication_outbox_touch_updated_at on public.communication_outbox;
drop trigger if exists communication_threads_touch_updated_at on public.communication_threads;
drop trigger if exists communication_templates_touch_updated_at on public.nodere_communication_templates;
drop trigger if exists commercial_briefings_touch_updated_at on public.commercial_briefings;

drop table if exists public.nodere_audit_events;
drop table if exists public.integration_connections;
drop table if exists public.communication_outbox;
drop table if exists public.communication_events;
drop table if exists public.communication_threads;
drop table if exists public.communication_template_versions;
drop table if exists public.nodere_communication_templates;
drop table if exists public.commercial_briefing_attachments;
drop table if exists public.briefing_answers;
drop table if exists public.briefing_versions;
drop table if exists public.briefing_field_mappings;
drop table if exists public.commercial_briefings;

drop function if exists public.nodere_reject_immutable_change();
drop function if exists public.nodere_touch_commercial_updated_at();

alter table public.nodere_companies
  drop column if exists legal_hold,
  drop column if exists delete_reason,
  drop column if exists purge_after,
  drop column if exists trashed_by,
  drop column if exists trashed_at,
  drop column if exists archived_by,
  drop column if exists archived_at,
  drop column if exists record_state;

commit;
