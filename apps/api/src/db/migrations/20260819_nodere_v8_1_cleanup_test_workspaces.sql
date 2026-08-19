-- V8.1: remove only deterministic V6 homologation residue.
-- Immutable event triggers are disabled only inside the migration transaction
-- and restored before commit. The canonical `default` workspace is never in scope.

alter table public.communication_events
  disable trigger communication_events_immutable;

alter table public.nodere_audit_events
  disable trigger nodere_audit_events_immutable;

delete from public.communication_events
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_audit_events
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

alter table public.communication_events
  enable trigger communication_events_immutable;

alter table public.nodere_audit_events
  enable trigger nodere_audit_events_immutable;

delete from public.communication_threads
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.download_logs
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_app_settings
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_audit_logs
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_companies
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_test_data_registry
where workspace_id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');

delete from public.nodere_workspaces
where id in ('TESTE_V6_HOMOLOGACAO_NODERE', 'TESTE_V6_HOMOLOGACAO_CANARY');
