-- NODERE V6 — alinhamento aditivo do schema canônico de empresas com o backend.
-- Mantém todos os registros existentes e não promove resultados de busca a leads.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.nodere_companies
  add column if not exists temperature text default 'Morno',
  add column if not exists probability integer default 0,
  add column if not exists deal_value numeric(12,2),
  add column if not exists expected_close_date date,
  add column if not exists next_action text,
  add column if not exists owner_id text,
  add column if not exists source text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nodere_companies_probability_check') then
    alter table public.nodere_companies
      add constraint nodere_companies_probability_check
      check (probability is null or probability between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nodere_companies_deal_value_check') then
    alter table public.nodere_companies
      add constraint nodere_companies_deal_value_check
      check (deal_value is null or deal_value >= 0);
  end if;
end $$;

create index if not exists idx_nodere_companies_workspace_owner
  on public.nodere_companies(workspace_id, owner_id);

create index if not exists idx_nodere_companies_workspace_next_action
  on public.nodere_companies(workspace_id, expected_close_date)
  where next_action is not null;

commit;
