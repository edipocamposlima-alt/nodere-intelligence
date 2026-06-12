-- BLOCO 08 - Calendario Comercial v1
-- Aplicar manualmente no Supabase SQL Editor do projeto correto.
-- Este script evolui a tabela public.calendar_events existente.
-- Nao cria users, workspaces ou estruturas paralelas.

alter table public.calendar_events
  add column if not exists assigned_to text,
  add column if not exists created_by text,
  add column if not exists reminder_at timestamptz,
  add column if not exists reminder_minutes integer not null default 30,
  add column if not exists reminder_enabled boolean not null default false;

alter table public.calendar_events
  drop constraint if exists calendar_events_type_check;

alter table public.calendar_events
  add constraint calendar_events_type_check
  check (
    type in (
      'ligacao',
      'call',
      'reuniao',
      'meeting',
      'demonstracao',
      'demo',
      'proposta',
      'proposal',
      'retorno',
      'followup',
      'follow-up',
      'follow_up',
      'pos_venda',
      'after_sale',
      'tarefa',
      'task',
      'interno',
      'internal',
      'postagem',
      'content_post'
    )
  );

alter table public.calendar_events
  drop constraint if exists calendar_events_status_check;

alter table public.calendar_events
  add constraint calendar_events_status_check
  check (
    status in (
      'pendente',
      'confirmado',
      'realizado',
      'cancelado',
      'reagendado',
      'concluido',
      'rascunho',
      'Rascunho'
    )
  );

create index if not exists idx_calendar_events_operator
  on public.calendar_events(workspace_id, assigned_to, start_at);

create index if not exists idx_calendar_events_company_operator
  on public.calendar_events(workspace_id, company_id, assigned_to, start_at);

create index if not exists idx_calendar_events_reminders
  on public.calendar_events(workspace_id, reminder_enabled, reminder_at)
  where reminder_enabled = true;
