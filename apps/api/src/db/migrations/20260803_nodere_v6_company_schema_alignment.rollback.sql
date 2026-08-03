begin;

drop index if exists public.idx_nodere_companies_workspace_next_action;
drop index if exists public.idx_nodere_companies_workspace_owner;

alter table public.nodere_companies
  drop constraint if exists nodere_companies_probability_check,
  drop constraint if exists nodere_companies_deal_value_check,
  drop column if exists source,
  drop column if exists owner_id,
  drop column if exists next_action,
  drop column if exists expected_close_date,
  drop column if exists deal_value,
  drop column if exists probability,
  drop column if exists temperature;

commit;
