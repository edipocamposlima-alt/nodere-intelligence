-- BLOCO 05 - Propostas, Billing e Admin
-- Schema real NODERE: usa nodere_workspaces, nodere_platform_users e nodere_companies.
-- Nao cria users/workspaces/leads/companies paralelos. Nao apaga dados.

create extension if not exists pgcrypto;

create table if not exists public.nodere_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  lead_id text not null,
  title text not null,
  status text not null default 'draft',
  service_type text,
  content text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  valid_until date,
  version integer not null default 1,
  created_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nodere_proposals_status_check check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired'))
);

create index if not exists idx_nodere_proposals_workspace on public.nodere_proposals(workspace_id);
create index if not exists idx_nodere_proposals_lead on public.nodere_proposals(lead_id);
create index if not exists idx_nodere_proposals_status on public.nodere_proposals(status);
create index if not exists idx_nodere_proposals_updated_at on public.nodere_proposals(updated_at desc);

alter table public.nodere_proposals enable row level security;

drop policy if exists nodere_proposals_workspace_select on public.nodere_proposals;
create policy nodere_proposals_workspace_select
on public.nodere_proposals
for select
to authenticated
using (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
);

drop policy if exists nodere_proposals_workspace_insert on public.nodere_proposals;
create policy nodere_proposals_workspace_insert
on public.nodere_proposals
for insert
to authenticated
with check (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
);

drop policy if exists nodere_proposals_workspace_update on public.nodere_proposals;
create policy nodere_proposals_workspace_update
on public.nodere_proposals
for update
to authenticated
using (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
)
with check (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
);

create table if not exists public.nodere_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  user_id text,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_audit_logs_workspace on public.nodere_audit_logs(workspace_id);
create index if not exists idx_nodere_audit_logs_resource on public.nodere_audit_logs(resource_type, resource_id);
create index if not exists idx_nodere_audit_logs_created_at on public.nodere_audit_logs(created_at desc);

alter table public.nodere_audit_logs enable row level security;

drop policy if exists nodere_audit_logs_workspace_select on public.nodere_audit_logs;
create policy nodere_audit_logs_workspace_select
on public.nodere_audit_logs
for select
to authenticated
using (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
);

drop policy if exists nodere_audit_logs_workspace_insert on public.nodere_audit_logs;
create policy nodere_audit_logs_workspace_insert
on public.nodere_audit_logs
for insert
to authenticated
with check (
  workspace_id = coalesce(
    nullif(auth.jwt() ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'app_metadata') ->> 'workspace_id', ''),
    nullif((auth.jwt() -> 'user_metadata') ->> 'workspace_id', '')
  )
);

create or replace function public.nodere_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_nodere_proposals_updated_at on public.nodere_proposals;
create trigger trg_nodere_proposals_updated_at
before update on public.nodere_proposals
for each row
execute function public.nodere_touch_updated_at();

insert into public.nodere_plan_limits (plan, seats_limit, credits_limit, modules, features)
values
  ('demo', 1, 200, '["DISC-01","CRM-01","CRM-02"]'::jsonb, '{"billing":"demo"}'::jsonb),
  ('starter', 1, 200, '["DISC-01","CRM-01","CRM-02","CRM-04"]'::jsonb, '{"proposals":true,"pdf":true}'::jsonb),
  ('pro', 3, 600, '["DISC-01","CRM-01","CRM-02","CRM-03","CRM-04","ANA-01","ANA-02"]'::jsonb, '{"proposals":true,"pdf":true,"reports":true}'::jsonb),
  ('agency', 10, 999999, '["DISC-01","CRM-01","CRM-02","CRM-03","CRM-04","ENG-01","ENG-03","ENG-04","AI-01","ANA-01","ANA-02","OPS-01"]'::jsonb, '{"proposals":true,"pdf":true,"reports":true,"advanced_admin":true}'::jsonb),
  ('enterprise', 999, 999999, '["DISC-01","CRM-01","CRM-02","CRM-03","CRM-04","ENG-01","ENG-03","ENG-04","AI-01","ANA-01","ANA-02","OPS-01"]'::jsonb, '{"proposals":true,"pdf":true,"reports":true,"advanced_admin":true,"sla":true}'::jsonb)
on conflict (plan) do update set
  seats_limit = excluded.seats_limit,
  credits_limit = excluded.credits_limit,
  modules = excluded.modules,
  features = excluded.features;

notify pgrst, 'reload schema';
