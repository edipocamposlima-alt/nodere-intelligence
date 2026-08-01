-- Rollback destrutivo apenas para a extensao AI-first de 2026-07-22.
-- Nao altera tabelas comerciais preexistentes nem o saldo legado em nodere_workspaces.

begin;

drop trigger if exists nodere_ai_seed_wallet_after_workspace_insert on public.nodere_workspaces;
drop function if exists public.nodere_ai_seed_wallet();
drop function if exists public.nodere_ai_reserve_credits(text, uuid, text, numeric);
drop function if exists public.nodere_ai_capture_credits(text, uuid, text, numeric, numeric, jsonb);
drop function if exists public.nodere_ai_release_credits(text, uuid, text, jsonb);
drop function if exists public.nodere_ai_grant_credits(text, text, numeric, jsonb);
drop function if exists public.nodere_consume_credits(text, text, numeric, jsonb);

drop table if exists public.nodere_credit_ledger;
drop table if exists public.nodere_credit_wallets;
drop table if exists public.nodere_ai_tool_receipts;
drop table if exists public.nodere_ai_executions;
drop table if exists public.nodere_ai_messages;
drop table if exists public.nodere_ai_conversations;
drop table if exists public.nodere_ai_agents;
drop table if exists public.nodere_ai_model_registry;

commit;
