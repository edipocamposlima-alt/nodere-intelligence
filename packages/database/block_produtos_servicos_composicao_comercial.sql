-- NODERE - Produtos/Servicos e composicao comercial
-- Migração idempotente para conectar catálogo, propostas, snapshot, descontos, auditoria e PDF.
-- Nao remove dados, nao recria tabelas existentes e nao executa operacoes destrutivas.

create extension if not exists pgcrypto;

alter table public.catalog_items add column if not exists commercial_guidance text;
alter table public.catalog_items add column if not exists billing_unit text not null default 'unit';
alter table public.catalog_items add column if not exists payment_method text;
alter table public.catalog_items add column if not exists execution_deadline text;
alter table public.catalog_items add column if not exists internal_notes text;
alter table public.catalog_items add column if not exists created_by text;
alter table public.catalog_items add column if not exists updated_by text;
alter table public.catalog_items add column if not exists deleted_at timestamptz;
alter table public.catalog_items add column if not exists deleted_by text;

update public.catalog_items
set billing_unit = coalesce(nullif(billing_unit, ''), nullif(unit_measure, ''), 'unit')
where billing_unit is null or billing_unit = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_items_billing_unit_check'
      and conrelid = 'public.catalog_items'::regclass
  ) then
    alter table public.catalog_items
      add constraint catalog_items_billing_unit_check
      check (billing_unit in ('unit', 'hour', 'monthly', 'package', 'project', 'daily', 'other'));
  end if;
end $$;

alter table public.nodere_proposals add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.nodere_proposals add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.nodere_proposals add column if not exists subtotal numeric(14,2) not null default 0;
alter table public.nodere_proposals add column if not exists discount numeric(14,2) not null default 0;
alter table public.nodere_proposals add column if not exists total numeric(14,2) not null default 0;

create index if not exists idx_catalog_items_commercial_active
  on public.catalog_items(workspace_id, status, type, billing_unit);

create index if not exists idx_catalog_items_updated_at
  on public.catalog_items(updated_at desc);

create index if not exists idx_nodere_proposals_commercial_snapshot
  on public.nodere_proposals using gin (items);

create index if not exists idx_nodere_audit_logs_proposal_actions
  on public.nodere_audit_logs(workspace_id, resource_type, action, created_at desc);

comment on column public.catalog_items.commercial_guidance is 'Orientacao comercial congelada no snapshot da proposta/contrato.';
comment on column public.catalog_items.billing_unit is 'Unidade comercial oficial usada para cobranca e composicao de propostas.';
comment on column public.catalog_items.internal_notes is 'Observacoes internas do catalogo; nunca devem aparecer em PDFs comerciais.';
comment on column public.nodere_proposals.items is 'Snapshot comercial dos itens selecionados do catalogo no momento da proposta.';

notify pgrst, 'reload schema';
