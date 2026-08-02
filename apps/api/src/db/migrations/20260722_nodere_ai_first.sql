-- NODERE AI-first v3 — schema aditivo, ledger transacional e isolamento por workspace.
-- Precos OpenAI vigentes em 2026-07-22, por 1M tokens, em USD.
-- Fonte: https://developers.openai.com/api/docs/models

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create extension if not exists pgcrypto;

create table if not exists public.nodere_ai_model_registry (
  id text primary key,
  provider text not null check (provider in ('openai', 'anthropic')),
  provider_model_id text not null,
  label text not null,
  capability_tier text not null check (capability_tier in ('efficient', 'balanced', 'frontier')),
  context_window_tokens integer,
  max_output_tokens integer,
  input_cost_usd_per_million numeric(12,6) not null check (input_cost_usd_per_million >= 0),
  cached_input_cost_usd_per_million numeric(12,6) not null check (cached_input_cost_usd_per_million >= 0),
  output_cost_usd_per_million numeric(12,6) not null check (output_cost_usd_per_million >= 0),
  reasoning_effort text not null default 'medium' check (reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')),
  allowed_roles text[] not null default array['owner','admin','operator','viewer']::text[],
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_model_id)
);

insert into public.nodere_ai_model_registry (
  id, provider, provider_model_id, label, capability_tier,
  context_window_tokens, max_output_tokens,
  input_cost_usd_per_million, cached_input_cost_usd_per_million,
  output_cost_usd_per_million, reasoning_effort, allowed_roles, metadata
)
values
  ('openai:gpt-5.6-luna', 'openai', 'gpt-5.6-luna', 'GPT-5.6 Luna', 'efficient', 1050000, 128000, 1.00, 0.10, 6.00, 'low', array['owner','admin','operator','viewer'], '{"pricing_verified_at":"2026-07-22","source":"openai_official"}'::jsonb),
  ('openai:gpt-5.6-terra', 'openai', 'gpt-5.6-terra', 'GPT-5.6 Terra', 'balanced', 1050000, 128000, 2.50, 0.25, 15.00, 'medium', array['owner','admin','operator','viewer'], '{"pricing_verified_at":"2026-07-22","source":"openai_official"}'::jsonb),
  ('openai:gpt-5.6-sol', 'openai', 'gpt-5.6-sol', 'GPT-5.6 Sol', 'frontier', 1050000, 128000, 5.00, 0.50, 30.00, 'high', array['owner','admin','operator'], '{"pricing_verified_at":"2026-07-22","source":"openai_official"}'::jsonb)
on conflict (id) do update set
  label = excluded.label,
  capability_tier = excluded.capability_tier,
  context_window_tokens = excluded.context_window_tokens,
  max_output_tokens = excluded.max_output_tokens,
  input_cost_usd_per_million = excluded.input_cost_usd_per_million,
  cached_input_cost_usd_per_million = excluded.cached_input_cost_usd_per_million,
  output_cost_usd_per_million = excluded.output_cost_usd_per_million,
  allowed_roles = excluded.allowed_roles,
  metadata = excluded.metadata,
  updated_at = now();

create table if not exists public.nodere_ai_agents (
  id text primary key,
  workspace_id text references public.nodere_workspaces(id) on delete cascade,
  label text not null,
  description text not null,
  system_prompt text not null,
  default_model_id text not null references public.nodere_ai_model_registry(id),
  allowed_model_ids text[] not null default '{}'::text[],
  allowed_tools text[] not null default '{}'::text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists nodere_ai_agents_workspace_label_uidx
  on public.nodere_ai_agents (coalesce(workspace_id, ''), lower(label));
create index if not exists nodere_ai_agents_workspace_idx
  on public.nodere_ai_agents (workspace_id, enabled);
create index if not exists nodere_ai_agents_model_idx
  on public.nodere_ai_agents (default_model_id);

insert into public.nodere_ai_agents (id, label, description, system_prompt, default_model_id, allowed_model_ids, allowed_tools)
values
  ('commercial-copilot', 'Copiloto comercial', 'Coordena a operacao comercial com contexto do CRM e limites de autorizacao.', 'Voce e o Copiloto Comercial da NODERE. Responda em portugues brasileiro, seja objetivo, use apenas dados retornados pelas ferramentas e nunca alegue que uma acao ocorreu sem um recibo de ferramenta. Solicite aprovacao quando a ferramenta exigir.', 'openai:gpt-5.6-terra', array['openai:gpt-5.6-luna','openai:gpt-5.6-terra','openai:gpt-5.6-sol'], array['list_companies','get_company','create_company','update_pipeline_stage']),
  ('prospecting-analyst', 'Analista de prospeccao', 'Prioriza contas e encontra oportunidades verificaveis no CRM.', 'Voce e o Analista de Prospeccao da NODERE. Baseie recomendacoes nos registros do workspace, explicite incertezas e nao invente contatos, sinais ou resultados.', 'openai:gpt-5.6-luna', array['openai:gpt-5.6-luna','openai:gpt-5.6-terra'], array['list_companies','get_company']),
  ('pipeline-coach', 'Coach de pipeline', 'Analisa gargalos e recomenda proximas acoes no funil.', 'Voce e o Coach de Pipeline da NODERE. Use dados reais do CRM, diferencie recomendacao de execucao e confirme alteracoes de etapa antes de executa-las.', 'openai:gpt-5.6-terra', array['openai:gpt-5.6-luna','openai:gpt-5.6-terra'], array['list_companies','get_company','update_pipeline_stage']),
  ('proposal-strategist', 'Estrategista de propostas', 'Estrutura argumentos e proximos passos para oportunidades qualificadas.', 'Voce e o Estrategista de Propostas da NODERE. Nao envie mensagens nem propostas por conta propria; produza rascunhos e use ferramentas autorizadas somente apos aprovacao.', 'openai:gpt-5.6-sol', array['openai:gpt-5.6-terra','openai:gpt-5.6-sol'], array['list_companies','get_company'])
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  system_prompt = excluded.system_prompt,
  default_model_id = excluded.default_model_id,
  allowed_model_ids = excluded.allowed_model_ids,
  allowed_tools = excluded.allowed_tools,
  updated_at = now();

create table if not exists public.nodere_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  user_id text,
  agent_id text not null references public.nodere_ai_agents(id),
  model_id text not null references public.nodere_ai_model_registry(id),
  title text not null default 'Nova conversa',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodere_ai_conversations_workspace_updated_idx
  on public.nodere_ai_conversations (workspace_id, updated_at desc);
create index if not exists nodere_ai_conversations_agent_idx
  on public.nodere_ai_conversations (agent_id);
create index if not exists nodere_ai_conversations_model_idx
  on public.nodere_ai_conversations (model_id);

create table if not exists public.nodere_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.nodere_ai_conversations(id) on delete cascade,
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  parts jsonb not null default '[]'::jsonb,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists nodere_ai_messages_conversation_created_idx
  on public.nodere_ai_messages (conversation_id, created_at);
create index if not exists nodere_ai_messages_workspace_created_idx
  on public.nodere_ai_messages (workspace_id, created_at desc);
create unique index if not exists nodere_ai_messages_provider_message_uidx
  on public.nodere_ai_messages (conversation_id, provider_message_id)
  where provider_message_id is not null;

create table if not exists public.nodere_ai_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  conversation_id uuid references public.nodere_ai_conversations(id) on delete set null,
  user_id text,
  agent_id text not null references public.nodere_ai_agents(id),
  model_id text not null references public.nodere_ai_model_registry(id),
  provider text not null,
  idempotency_key text not null,
  status text not null default 'pending' check (status in ('pending', 'reserved', 'streaming', 'succeeded', 'failed', 'cancelled')),
  reserved_credit numeric(14,4) not null default 0 check (reserved_credit >= 0),
  charged_credit numeric(14,4) not null default 0 check (charged_credit >= 0),
  provider_cost_usd numeric(14,8) not null default 0 check (provider_cost_usd >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create index if not exists nodere_ai_executions_workspace_started_idx
  on public.nodere_ai_executions (workspace_id, started_at desc);
create index if not exists nodere_ai_executions_conversation_idx
  on public.nodere_ai_executions (conversation_id, started_at desc);
create index if not exists nodere_ai_executions_status_idx
  on public.nodere_ai_executions (workspace_id, status, started_at desc);
create index if not exists nodere_ai_executions_agent_idx
  on public.nodere_ai_executions (agent_id);
create index if not exists nodere_ai_executions_model_idx
  on public.nodere_ai_executions (model_id);

create table if not exists public.nodere_ai_tool_receipts (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  execution_id uuid not null references public.nodere_ai_executions(id) on delete cascade,
  conversation_id uuid references public.nodere_ai_conversations(id) on delete set null,
  tool_call_id text not null,
  tool_name text not null,
  idempotency_key text not null,
  risk_level text not null check (risk_level in ('read', 'write', 'external', 'destructive')),
  approval_required boolean not null default false,
  approved_by text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'denied')),
  error_code text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (workspace_id, idempotency_key),
  unique (execution_id, tool_call_id)
);

create index if not exists nodere_ai_tool_receipts_workspace_created_idx
  on public.nodere_ai_tool_receipts (workspace_id, created_at desc);
create index if not exists nodere_ai_tool_receipts_execution_idx
  on public.nodere_ai_tool_receipts (execution_id);
create index if not exists nodere_ai_tool_receipts_conversation_idx
  on public.nodere_ai_tool_receipts (conversation_id)
  where conversation_id is not null;

create table if not exists public.nodere_credit_wallets (
  workspace_id text primary key references public.nodere_workspaces(id) on delete cascade,
  available_credit numeric(14,4) not null default 0 check (available_credit >= 0),
  held_credit numeric(14,4) not null default 0 check (held_credit >= 0),
  lifetime_spent_credit numeric(18,4) not null default 0 check (lifetime_spent_credit >= 0),
  credits_per_usd numeric(12,4) not null default 100 check (credits_per_usd > 0),
  updated_at timestamptz not null default now()
);

insert into public.nodere_credit_wallets (workspace_id, available_credit, lifetime_spent_credit)
select id, greatest(coalesce(credits, 0), 0)::numeric, greatest(coalesce(credits_used, 0), 0)::numeric
from public.nodere_workspaces
on conflict (workspace_id) do nothing;

create table if not exists public.nodere_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.nodere_workspaces(id) on delete cascade,
  execution_id uuid references public.nodere_ai_executions(id) on delete set null,
  idempotency_key text not null,
  entry_type text not null check (entry_type in ('opening', 'grant', 'reserve', 'capture', 'release', 'refund', 'adjustment')),
  amount_credit numeric(14,4) not null check (amount_credit >= 0),
  available_delta numeric(14,4) not null default 0,
  held_delta numeric(14,4) not null default 0,
  available_after numeric(14,4) not null,
  held_after numeric(14,4) not null,
  provider_cost_usd numeric(14,8),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists nodere_credit_ledger_workspace_created_idx
  on public.nodere_credit_ledger (workspace_id, created_at desc);
create index if not exists nodere_credit_ledger_execution_idx
  on public.nodere_credit_ledger (execution_id, created_at);

insert into public.nodere_credit_ledger (
  workspace_id, idempotency_key, entry_type, amount_credit,
  available_delta, held_delta, available_after, held_after, metadata
)
select workspace_id, 'migration:20260722:opening', 'opening', available_credit,
       available_credit, 0, available_credit, held_credit,
       '{"source":"legacy_workspace_balance"}'::jsonb
from public.nodere_credit_wallets
on conflict (workspace_id, idempotency_key) do nothing;

create or replace function public.nodere_ai_seed_wallet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.nodere_credit_wallets (workspace_id, available_credit)
  values (new.id, greatest(coalesce(new.credits, 0), 0)::numeric)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists nodere_ai_seed_wallet_after_workspace_insert on public.nodere_workspaces;
create trigger nodere_ai_seed_wallet_after_workspace_insert
after insert on public.nodere_workspaces
for each row execute function public.nodere_ai_seed_wallet();

create or replace function public.nodere_ai_reserve_credits(
  p_workspace_id text,
  p_execution_id uuid,
  p_idempotency_key text,
  p_amount numeric
)
returns table (ledger_id uuid, available_credit numeric, held_credit numeric, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
  v_available numeric;
  v_held numeric;
begin
  if p_amount <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_RESERVATION_AMOUNT';
  end if;

  insert into public.nodere_credit_wallets (workspace_id, available_credit)
  select w.id, greatest(coalesce(w.credits, 0), 0)::numeric
  from public.nodere_workspaces w
  where w.id = p_workspace_id
  on conflict (workspace_id) do nothing;

  select wallet.available_credit, wallet.held_credit
    into v_available, v_held
  from public.nodere_credit_wallets wallet
  where wallet.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_WALLET_NOT_FOUND';
  end if;

  select ledger.id into v_ledger_id
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.idempotency_key = p_idempotency_key;

  if v_ledger_id is not null then
    return query select v_ledger_id, v_available, v_held, true;
    return;
  end if;

  if v_available < p_amount then
    raise exception using errcode = 'P0001', message = 'CREDITS_EXHAUSTED';
  end if;

  update public.nodere_credit_wallets wallet
  set available_credit = wallet.available_credit - p_amount,
      held_credit = wallet.held_credit + p_amount,
      updated_at = now()
  where wallet.workspace_id = p_workspace_id
  returning wallet.available_credit, wallet.held_credit into v_available, v_held;

  insert into public.nodere_credit_ledger (
    workspace_id, execution_id, idempotency_key, entry_type, amount_credit,
    available_delta, held_delta, available_after, held_after
  ) values (
    p_workspace_id, p_execution_id, p_idempotency_key, 'reserve', p_amount,
    -p_amount, p_amount, v_available, v_held
  ) returning id into v_ledger_id;

  return query select v_ledger_id, v_available, v_held, false;
end;
$$;

create or replace function public.nodere_ai_capture_credits(
  p_workspace_id text,
  p_execution_id uuid,
  p_idempotency_key text,
  p_actual_amount numeric,
  p_provider_cost_usd numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns table (ledger_id uuid, available_credit numeric, held_credit numeric, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
  v_reserved numeric;
  v_available numeric;
  v_held numeric;
  v_extra numeric;
  v_release numeric;
begin
  if p_actual_amount < 0 or p_provider_cost_usd < 0 then
    raise exception using errcode = '22023', message = 'INVALID_CAPTURE_AMOUNT';
  end if;

  select wallet.available_credit, wallet.held_credit
    into v_available, v_held
  from public.nodere_credit_wallets wallet
  where wallet.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_WALLET_NOT_FOUND';
  end if;

  select ledger.id into v_ledger_id
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.idempotency_key = p_idempotency_key;

  if v_ledger_id is not null then
    return query select v_ledger_id, v_available, v_held, true;
    return;
  end if;

  select ledger.amount_credit into v_reserved
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.execution_id = p_execution_id
    and ledger.entry_type = 'reserve'
  order by ledger.created_at desc
  limit 1;

  if v_reserved is null then
    raise exception using errcode = 'P0001', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  v_extra := greatest(p_actual_amount - v_reserved, 0);
  v_release := greatest(v_reserved - p_actual_amount, 0);
  if v_available < v_extra or v_held < v_reserved then
    raise exception using errcode = 'P0001', message = 'AI_CAPTURE_EXCEEDS_RESERVATION';
  end if;

  update public.nodere_credit_wallets wallet
  set available_credit = wallet.available_credit - v_extra + v_release,
      held_credit = wallet.held_credit - v_reserved,
      lifetime_spent_credit = wallet.lifetime_spent_credit + p_actual_amount,
      updated_at = now()
  where wallet.workspace_id = p_workspace_id
  returning wallet.available_credit, wallet.held_credit into v_available, v_held;

  insert into public.nodere_credit_ledger (
    workspace_id, execution_id, idempotency_key, entry_type, amount_credit,
    available_delta, held_delta, available_after, held_after,
    provider_cost_usd, metadata
  ) values (
    p_workspace_id, p_execution_id, p_idempotency_key, 'capture', p_actual_amount,
    -v_extra + v_release, -v_reserved, v_available, v_held,
    p_provider_cost_usd, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_ledger_id;

  return query select v_ledger_id, v_available, v_held, false;
end;
$$;

create or replace function public.nodere_ai_release_credits(
  p_workspace_id text,
  p_execution_id uuid,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (ledger_id uuid, available_credit numeric, held_credit numeric, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
  v_reserved numeric;
  v_available numeric;
  v_held numeric;
begin
  select wallet.available_credit, wallet.held_credit
    into v_available, v_held
  from public.nodere_credit_wallets wallet
  where wallet.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_WALLET_NOT_FOUND';
  end if;

  select ledger.id into v_ledger_id
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.idempotency_key = p_idempotency_key;

  if v_ledger_id is not null then
    return query select v_ledger_id, v_available, v_held, true;
    return;
  end if;

  if exists (
    select 1 from public.nodere_credit_ledger ledger
    where ledger.workspace_id = p_workspace_id
      and ledger.execution_id = p_execution_id
      and ledger.entry_type = 'capture'
  ) then
    raise exception using errcode = 'P0001', message = 'CREDIT_ALREADY_CAPTURED';
  end if;

  select ledger.amount_credit into v_reserved
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.execution_id = p_execution_id
    and ledger.entry_type = 'reserve'
  order by ledger.created_at desc
  limit 1;

  if v_reserved is null then
    raise exception using errcode = 'P0001', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;
  if v_held < v_reserved then
    raise exception using errcode = 'P0001', message = 'INVALID_HELD_CREDIT_STATE';
  end if;

  update public.nodere_credit_wallets wallet
  set available_credit = wallet.available_credit + v_reserved,
      held_credit = wallet.held_credit - v_reserved,
      updated_at = now()
  where wallet.workspace_id = p_workspace_id
  returning wallet.available_credit, wallet.held_credit into v_available, v_held;

  insert into public.nodere_credit_ledger (
    workspace_id, execution_id, idempotency_key, entry_type, amount_credit,
    available_delta, held_delta, available_after, held_after, metadata
  ) values (
    p_workspace_id, p_execution_id, p_idempotency_key, 'release', v_reserved,
    v_reserved, -v_reserved, v_available, v_held, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_ledger_id;

  return query select v_ledger_id, v_available, v_held, false;
end;
$$;

create or replace function public.nodere_ai_grant_credits(
  p_workspace_id text,
  p_idempotency_key text,
  p_amount numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns table (ledger_id uuid, available_credit numeric, held_credit numeric, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
  v_available numeric;
  v_held numeric;
begin
  if p_amount <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_GRANT_AMOUNT';
  end if;

  select wallet.available_credit, wallet.held_credit
    into v_available, v_held
  from public.nodere_credit_wallets wallet
  where wallet.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_WALLET_NOT_FOUND';
  end if;

  select ledger.id into v_ledger_id
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.idempotency_key = p_idempotency_key;

  if v_ledger_id is not null then
    return query select v_ledger_id, v_available, v_held, true;
    return;
  end if;

  update public.nodere_credit_wallets wallet
  set available_credit = wallet.available_credit + p_amount,
      updated_at = now()
  where wallet.workspace_id = p_workspace_id
  returning wallet.available_credit, wallet.held_credit into v_available, v_held;

  insert into public.nodere_credit_ledger (
    workspace_id, idempotency_key, entry_type, amount_credit,
    available_delta, held_delta, available_after, held_after, metadata
  ) values (
    p_workspace_id, p_idempotency_key, 'grant', p_amount,
    p_amount, 0, v_available, v_held, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_ledger_id;

  return query select v_ledger_id, v_available, v_held, false;
end;
$$;

create or replace function public.nodere_consume_credits(
  p_workspace_id text,
  p_idempotency_key text,
  p_amount numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns table (ledger_id uuid, available_credit numeric, held_credit numeric, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
  v_available numeric;
  v_held numeric;
begin
  if p_amount <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_CONSUMPTION_AMOUNT';
  end if;

  select wallet.available_credit, wallet.held_credit
    into v_available, v_held
  from public.nodere_credit_wallets wallet
  where wallet.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_WALLET_NOT_FOUND';
  end if;

  select ledger.id into v_ledger_id
  from public.nodere_credit_ledger ledger
  where ledger.workspace_id = p_workspace_id
    and ledger.idempotency_key = p_idempotency_key;

  if v_ledger_id is not null then
    return query select v_ledger_id, v_available, v_held, true;
    return;
  end if;

  if v_available < p_amount then
    raise exception using errcode = 'P0001', message = 'CREDITS_EXHAUSTED';
  end if;

  update public.nodere_credit_wallets wallet
  set available_credit = wallet.available_credit - p_amount,
      lifetime_spent_credit = wallet.lifetime_spent_credit + p_amount,
      updated_at = now()
  where wallet.workspace_id = p_workspace_id
  returning wallet.available_credit, wallet.held_credit into v_available, v_held;

  insert into public.nodere_credit_ledger (
    workspace_id, idempotency_key, entry_type, amount_credit,
    available_delta, held_delta, available_after, held_after, metadata
  ) values (
    p_workspace_id, p_idempotency_key, 'capture', p_amount,
    -p_amount, 0, v_available, v_held, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_ledger_id;

  update public.nodere_workspaces workspace
  set credits = floor(v_available)::integer,
      credits_used = coalesce(workspace.credits_used, 0) + ceil(p_amount)::integer,
      updated_at = now()
  where workspace.id = p_workspace_id;

  return query select v_ledger_id, v_available, v_held, false;
end;
$$;

alter table public.nodere_ai_model_registry enable row level security;
alter table public.nodere_ai_agents enable row level security;
alter table public.nodere_ai_conversations enable row level security;
alter table public.nodere_ai_messages enable row level security;
alter table public.nodere_ai_executions enable row level security;
alter table public.nodere_ai_tool_receipts enable row level security;
alter table public.nodere_credit_wallets enable row level security;
alter table public.nodere_credit_ledger enable row level security;

alter table public.nodere_ai_model_registry force row level security;
alter table public.nodere_ai_agents force row level security;
alter table public.nodere_ai_conversations force row level security;
alter table public.nodere_ai_messages force row level security;
alter table public.nodere_ai_executions force row level security;
alter table public.nodere_ai_tool_receipts force row level security;
alter table public.nodere_credit_wallets force row level security;
alter table public.nodere_credit_ledger force row level security;

revoke all on table public.nodere_ai_model_registry from public;
revoke all on table public.nodere_ai_agents from public;
revoke all on table public.nodere_ai_conversations from public;
revoke all on table public.nodere_ai_messages from public;
revoke all on table public.nodere_ai_executions from public;
revoke all on table public.nodere_ai_tool_receipts from public;
revoke all on table public.nodere_credit_wallets from public;
revoke all on table public.nodere_credit_ledger from public;

revoke execute on function public.nodere_ai_seed_wallet() from public;
revoke execute on function public.nodere_ai_reserve_credits(text, uuid, text, numeric) from public;
revoke execute on function public.nodere_ai_capture_credits(text, uuid, text, numeric, numeric, jsonb) from public;
revoke execute on function public.nodere_ai_release_credits(text, uuid, text, jsonb) from public;
revoke execute on function public.nodere_ai_grant_credits(text, text, numeric, jsonb) from public;
revoke execute on function public.nodere_consume_credits(text, text, numeric, jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.nodere_ai_model_registry, public.nodere_ai_agents, public.nodere_ai_conversations, public.nodere_ai_messages, public.nodere_ai_executions, public.nodere_ai_tool_receipts, public.nodere_credit_wallets, public.nodere_credit_ledger from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.nodere_ai_model_registry, public.nodere_ai_agents, public.nodere_ai_conversations, public.nodere_ai_messages, public.nodere_ai_executions, public.nodere_ai_tool_receipts, public.nodere_credit_wallets, public.nodere_credit_ledger from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update, delete on table public.nodere_ai_model_registry, public.nodere_ai_agents, public.nodere_ai_conversations, public.nodere_ai_messages, public.nodere_ai_executions, public.nodere_ai_tool_receipts, public.nodere_credit_wallets, public.nodere_credit_ledger to service_role';
    execute 'grant execute on function public.nodere_ai_reserve_credits(text, uuid, text, numeric), public.nodere_ai_capture_credits(text, uuid, text, numeric, numeric, jsonb), public.nodere_ai_release_credits(text, uuid, text, jsonb), public.nodere_ai_grant_credits(text, text, numeric, jsonb), public.nodere_consume_credits(text, text, numeric, jsonb) to service_role';
  end if;
end;
$$;

commit;
