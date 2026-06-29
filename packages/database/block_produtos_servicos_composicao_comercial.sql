-- NODERE - bloqueio de composicao comercial manual em propostas.
--
-- Aplicacao: manual no Supabase SQL editor, apos validar em staging.
-- Objetivo:
--   1. Criar catalogo oficial de produtos/servicos por workspace.
--   2. Garantir que propostas usem apenas itens ativos do catalogo.
--   3. Gravar snapshot comercial da proposta para PDF/auditoria.
--   4. Bloquear desconto simultaneo por percentual e valor.
--   5. Exigir motivo quando houver desconto.
--
-- Este arquivo nao executa alteracoes automaticamente pelo app.

begin;

create extension if not exists pgcrypto;

create table if not exists public.nodere_commercial_catalog_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  type text not null check (type in ('product', 'service')),
  name text not null,
  description text,
  unit text not null default 'un',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  currency text not null default 'BRL',
  active boolean not null default true,
  created_by text references public.nodere_platform_users(id),
  updated_by text references public.nodere_platform_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodere_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  company_id text,
  title text not null default 'Proposta comercial',
  status text not null default 'draft',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_percent numeric(5,2) check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  discount_value_cents integer check (discount_value_cents is null or discount_value_cents >= 0),
  discount_reason text,
  total_cents integer not null default 0 check (total_cents >= 0),
  commercial_snapshot jsonb not null default '{}'::jsonb,
  created_by text references public.nodere_platform_users(id),
  updated_by text references public.nodere_platform_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nodere_proposals_single_discount check (
    discount_percent is null or discount_value_cents is null
  ),
  constraint nodere_proposals_discount_reason_required check (
    (
      coalesce(discount_percent, 0) = 0
      and coalesce(discount_value_cents, 0) = 0
    )
    or nullif(trim(coalesce(discount_reason, '')), '') is not null
  )
);

alter table public.nodere_proposals
  add column if not exists company_id text,
  add column if not exists subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  add column if not exists discount_percent numeric(5,2) check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  add column if not exists discount_value_cents integer check (discount_value_cents is null or discount_value_cents >= 0),
  add column if not exists discount_reason text,
  add column if not exists total_cents integer not null default 0 check (total_cents >= 0),
  add column if not exists commercial_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists updated_by text references public.nodere_platform_users(id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nodere_proposals'
      and column_name = 'lead_id'
      and is_nullable = 'NO'
  ) then
    alter table public.nodere_proposals alter column lead_id drop not null;
  end if;
end $$;

alter table public.nodere_proposals
  drop constraint if exists nodere_proposals_single_discount,
  drop constraint if exists nodere_proposals_discount_reason_required;

alter table public.nodere_proposals
  add constraint nodere_proposals_single_discount check (
    discount_percent is null or discount_value_cents is null
  ),
  add constraint nodere_proposals_discount_reason_required check (
    (
      coalesce(discount_percent, 0) = 0
      and coalesce(discount_value_cents, 0) = 0
    )
    or nullif(trim(coalesce(discount_reason, '')), '') is not null
  );

create table if not exists public.nodere_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.nodere_proposals(id) on delete cascade,
  catalog_item_id uuid not null references public.nodere_commercial_catalog_items(id),
  item_snapshot jsonb not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.nodere_proposal_audit_logs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.nodere_proposals(id) on delete cascade,
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  actor_id text references public.nodere_platform_users(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_catalog_workspace_active
  on public.nodere_commercial_catalog_items(workspace_id, active);

create index if not exists idx_nodere_proposals_workspace
  on public.nodere_proposals(workspace_id, created_at desc);

create index if not exists idx_nodere_proposal_items_proposal
  on public.nodere_proposal_items(proposal_id);

create index if not exists idx_nodere_proposal_audit_proposal
  on public.nodere_proposal_audit_logs(proposal_id, created_at desc);

alter table public.nodere_platform_users
  drop constraint if exists nodere_platform_users_role_check;

alter table public.nodere_platform_users
  add constraint nodere_platform_users_role_check
  check (role in ('owner', 'admin', 'manager', 'operator', 'viewer'));

create or replace function public.nodere_current_user_role()
returns text
language sql
stable
security definer
as $$
  select role
  from public.nodere_platform_users
  where auth_user_id = auth.uid()
     or id = auth.uid()::text
  limit 1
$$;

create or replace function public.nodere_current_user_workspace_ids()
returns text[]
language sql
stable
security definer
as $$
  select coalesce(array_agg(workspace_id), array[]::text[])
  from public.nodere_platform_users
  where auth_user_id = auth.uid()
     or id = auth.uid()::text
$$;

create or replace function public.nodere_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.nodere_validate_proposal_item()
returns trigger
language plpgsql
as $$
declare
  proposal_workspace text;
  catalog_record public.nodere_commercial_catalog_items%rowtype;
begin
  select workspace_id into proposal_workspace
  from public.nodere_proposals
  where id = new.proposal_id;

  if proposal_workspace is null then
    raise exception 'Proposta inexistente.';
  end if;

  select * into catalog_record
  from public.nodere_commercial_catalog_items
  where id = new.catalog_item_id;

  if catalog_record.id is null then
    raise exception 'Item de catalogo inexistente.';
  end if;

  if catalog_record.workspace_id <> proposal_workspace then
    raise exception 'Item de catalogo pertence a outro workspace.';
  end if;

  if catalog_record.active is not true then
    raise exception 'Somente itens ativos do catalogo podem compor propostas.';
  end if;

  new.unit_price_cents = catalog_record.unit_price_cents;
  new.subtotal_cents = round(new.quantity * catalog_record.unit_price_cents);
  new.item_snapshot = jsonb_build_object(
    'catalog_item_id', catalog_record.id,
    'type', catalog_record.type,
    'name', catalog_record.name,
    'description', catalog_record.description,
    'unit', catalog_record.unit,
    'unit_price_cents', catalog_record.unit_price_cents,
    'currency', catalog_record.currency,
    'active_at_snapshot', catalog_record.active,
    'snapshotted_at', now()
  );

  return new;
end;
$$;

create or replace function public.nodere_recalculate_proposal_totals()
returns trigger
language plpgsql
as $$
declare
  target_proposal_id uuid;
  subtotal_amount integer;
  proposal_record public.nodere_proposals%rowtype;
  discount_amount integer;
begin
  if tg_op = 'DELETE' then
    target_proposal_id := old.proposal_id;
  else
    target_proposal_id := new.proposal_id;
  end if;

  select coalesce(sum(subtotal_cents), 0)::integer
    into subtotal_amount
  from public.nodere_proposal_items
  where proposal_id = target_proposal_id;

  select * into proposal_record
  from public.nodere_proposals
  where id = target_proposal_id;

  discount_amount := 0;
  if proposal_record.discount_percent is not null then
    discount_amount := round(subtotal_amount * (proposal_record.discount_percent / 100.0));
  elsif proposal_record.discount_value_cents is not null then
    discount_amount := proposal_record.discount_value_cents;
  end if;

  update public.nodere_proposals
  set
    subtotal_cents = subtotal_amount,
    total_cents = greatest(subtotal_amount - discount_amount, 0),
    commercial_snapshot = jsonb_build_object(
      'proposal_id', target_proposal_id,
      'subtotal_cents', subtotal_amount,
      'discount_percent', proposal_record.discount_percent,
      'discount_value_cents', proposal_record.discount_value_cents,
      'discount_reason', proposal_record.discount_reason,
      'total_cents', greatest(subtotal_amount - discount_amount, 0),
      'items', coalesce((
        select jsonb_agg(
          item_snapshot || jsonb_build_object(
            'quantity', quantity,
            'subtotal_cents', subtotal_cents
          )
          order by created_at
        )
        from public.nodere_proposal_items
        where proposal_id = target_proposal_id
      ), '[]'::jsonb),
      'snapshotted_at', now()
    ),
    updated_at = now()
  where id = target_proposal_id;

  return null;
end;
$$;

create or replace function public.nodere_recalculate_current_proposal()
returns trigger
language plpgsql
as $$
declare
  subtotal_amount integer;
  discount_amount integer;
begin
  select coalesce(sum(subtotal_cents), 0)::integer
    into subtotal_amount
  from public.nodere_proposal_items
  where proposal_id = new.id;

  discount_amount := 0;
  if new.discount_percent is not null then
    discount_amount := round(subtotal_amount * (new.discount_percent / 100.0));
  elsif new.discount_value_cents is not null then
    discount_amount := new.discount_value_cents;
  end if;

  new.subtotal_cents = subtotal_amount;
  new.total_cents = greatest(subtotal_amount - discount_amount, 0);
  new.commercial_snapshot = jsonb_build_object(
    'proposal_id', new.id,
    'subtotal_cents', subtotal_amount,
    'discount_percent', new.discount_percent,
    'discount_value_cents', new.discount_value_cents,
    'discount_reason', new.discount_reason,
    'total_cents', greatest(subtotal_amount - discount_amount, 0),
    'items', coalesce((
      select jsonb_agg(
        item_snapshot || jsonb_build_object(
          'quantity', quantity,
          'subtotal_cents', subtotal_cents
        )
        order by created_at
      )
      from public.nodere_proposal_items
      where proposal_id = new.id
    ), '[]'::jsonb),
    'snapshotted_at', now()
  );

  return new;
end;
$$;

drop trigger if exists nodere_catalog_touch_updated_at on public.nodere_commercial_catalog_items;
create trigger nodere_catalog_touch_updated_at
  before update on public.nodere_commercial_catalog_items
  for each row execute function public.nodere_touch_updated_at();

drop trigger if exists nodere_proposals_touch_updated_at on public.nodere_proposals;
create trigger nodere_proposals_touch_updated_at
  before update on public.nodere_proposals
  for each row execute function public.nodere_touch_updated_at();

drop trigger if exists nodere_recalculate_before_proposal_discount_change on public.nodere_proposals;
create trigger nodere_recalculate_before_proposal_discount_change
  before insert or update of discount_percent, discount_value_cents, discount_reason on public.nodere_proposals
  for each row execute function public.nodere_recalculate_current_proposal();

drop trigger if exists nodere_validate_proposal_item on public.nodere_proposal_items;
create trigger nodere_validate_proposal_item
  before insert or update on public.nodere_proposal_items
  for each row execute function public.nodere_validate_proposal_item();

drop trigger if exists nodere_recalculate_after_item_change on public.nodere_proposal_items;
create trigger nodere_recalculate_after_item_change
  after insert or update or delete on public.nodere_proposal_items
  for each row execute function public.nodere_recalculate_proposal_totals();

alter table public.nodere_commercial_catalog_items enable row level security;
alter table public.nodere_proposals enable row level security;
alter table public.nodere_proposal_items enable row level security;
alter table public.nodere_proposal_audit_logs enable row level security;

grant usage on schema public to authenticated;
grant select on public.nodere_workspaces to authenticated;
grant select on public.nodere_platform_users to authenticated;
grant select, insert, update, delete on public.nodere_commercial_catalog_items to authenticated;
grant select, insert, update, delete on public.nodere_proposals to authenticated;
grant select, insert, update, delete on public.nodere_proposal_items to authenticated;
grant select on public.nodere_proposal_audit_logs to authenticated;

drop policy if exists nodere_catalog_read_workspace on public.nodere_commercial_catalog_items;
create policy nodere_catalog_read_workspace on public.nodere_commercial_catalog_items
  for select using (
    workspace_id = any(public.nodere_current_user_workspace_ids())
  );

drop policy if exists nodere_catalog_write_admin_owner on public.nodere_commercial_catalog_items;
create policy nodere_catalog_write_admin_owner on public.nodere_commercial_catalog_items
  for all using (
    workspace_id = any(public.nodere_current_user_workspace_ids())
    and public.nodere_current_user_role() in ('admin', 'owner')
  )
  with check (
    workspace_id = any(public.nodere_current_user_workspace_ids())
    and public.nodere_current_user_role() in ('admin', 'owner')
  );

drop policy if exists nodere_proposals_workspace on public.nodere_proposals;
drop policy if exists nodere_proposals_read_workspace on public.nodere_proposals;
drop policy if exists nodere_proposals_write_workspace on public.nodere_proposals;

create policy nodere_proposals_read_workspace on public.nodere_proposals
  for select using (
    workspace_id = any(public.nodere_current_user_workspace_ids())
  );

create policy nodere_proposals_write_workspace on public.nodere_proposals
  for all using (
    workspace_id = any(public.nodere_current_user_workspace_ids())
    and public.nodere_current_user_role() in ('operator', 'manager', 'admin', 'owner')
  )
  with check (
    workspace_id = any(public.nodere_current_user_workspace_ids())
    and public.nodere_current_user_role() in ('operator', 'manager', 'admin', 'owner')
  );

drop policy if exists nodere_proposal_items_workspace on public.nodere_proposal_items;
drop policy if exists nodere_proposal_items_read_workspace on public.nodere_proposal_items;
drop policy if exists nodere_proposal_items_write_workspace on public.nodere_proposal_items;

create policy nodere_proposal_items_read_workspace on public.nodere_proposal_items
  for select using (
    proposal_id in (
      select id
      from public.nodere_proposals
      where workspace_id = any(public.nodere_current_user_workspace_ids())
    )
  );

create policy nodere_proposal_items_write_workspace on public.nodere_proposal_items
  for all using (
    proposal_id in (
      select id
      from public.nodere_proposals
      where workspace_id = any(public.nodere_current_user_workspace_ids())
    )
    and public.nodere_current_user_role() in ('operator', 'manager', 'admin', 'owner')
  )
  with check (
    proposal_id in (
      select id
      from public.nodere_proposals
      where workspace_id = any(public.nodere_current_user_workspace_ids())
    )
    and public.nodere_current_user_role() in ('operator', 'manager', 'admin', 'owner')
  );

drop policy if exists nodere_proposal_audit_workspace on public.nodere_proposal_audit_logs;
create policy nodere_proposal_audit_workspace on public.nodere_proposal_audit_logs
  for select using (
    workspace_id = any(public.nodere_current_user_workspace_ids())
  );

commit;
