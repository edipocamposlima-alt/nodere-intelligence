-- BLOCO 04 - Billing persistente NODERE
-- Aplicar manualmente no Supabase SQL Editor do projeto correto.
-- Este script NAO cria users, workspaces ou companies paralelos.
-- Ele preserva nodere_workspaces e usa workspace_id text para compatibilidade com o schema real atual.

create extension if not exists pgcrypto;

create table if not exists public.nodere_billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null,
  billing_cycle text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  seats_limit integer,
  credits_limit integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nodere_billing_subscriptions_plan_check
    check (plan in ('demo', 'starter', 'pro', 'agency')),
  constraint nodere_billing_subscriptions_cycle_check
    check (billing_cycle is null or billing_cycle in ('monthly', 'yearly'))
);

create unique index if not exists idx_nodere_billing_subscriptions_workspace
  on public.nodere_billing_subscriptions(workspace_id);

create unique index if not exists idx_nodere_billing_subscriptions_stripe_subscription
  on public.nodere_billing_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists idx_nodere_billing_subscriptions_status
  on public.nodere_billing_subscriptions(workspace_id, status, current_period_end desc);

create table if not exists public.nodere_stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists idx_nodere_stripe_events_processed
  on public.nodere_stripe_events(processed_at desc);

create table if not exists public.nodere_plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan text unique not null,
  seats_limit integer not null,
  credits_limit integer not null,
  modules jsonb not null default '[]',
  features jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint nodere_plan_limits_plan_check
    check (plan in ('demo', 'starter', 'pro', 'agency'))
);

insert into public.nodere_plan_limits (plan, seats_limit, credits_limit, modules, features)
values
  (
    'demo',
    1,
    200,
    '["DISC-01","CRM-01"]'::jsonb,
    '{"trial": true, "support": "community"}'::jsonb
  ),
  (
    'starter',
    1,
    200,
    '["DISC-01","DISC-02","CRM-01","CRM-02","ANA-01"]'::jsonb,
    '{"diagnosis_ai": true, "pdf_export": true, "whatsapp_templates": true}'::jsonb
  ),
  (
    'pro',
    3,
    600,
    '["DISC-01","DISC-02","DISC-06","CRM-01","CRM-02","CRM-04","ENG-01","ENG-03","ANA-01","ANA-02","INTEL-01"]'::jsonb,
    '{"priority_support": true, "inbox": true, "reports": true, "proposals": true}'::jsonb
  ),
  (
    'agency',
    10,
    999999,
    '["DISC-01","DISC-02","DISC-06","CRM-01","CRM-02","CRM-04","ENG-01","ENG-02","ENG-03","ANA-01","ANA-02","INTEL-01","OPS-01","ADMIN-01"]'::jsonb,
    '{"white_label": true, "audit_log": true, "dedicated_support": true, "unlimited_credits": true}'::jsonb
  )
on conflict (plan) do update set
  seats_limit = excluded.seats_limit,
  credits_limit = excluded.credits_limit,
  modules = excluded.modules,
  features = excluded.features;
