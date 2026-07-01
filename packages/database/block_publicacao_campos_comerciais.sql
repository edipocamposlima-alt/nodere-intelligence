-- NODERE - publicacao completa: campos comerciais e preferencias.
-- Migração idempotente, nao destrutiva.

alter table public.nodere_companies add column if not exists cnpj text;
alter table public.nodere_companies add column if not exists email_principal text;
alter table public.nodere_companies add column if not exists email_comercial text;
alter table public.nodere_companies add column if not exists resumo text;
alter table public.nodere_companies add column if not exists business_summary text;
alter table public.nodere_companies add column if not exists resumo_sobre_empresa text;
alter table public.nodere_companies add column if not exists place_id text;
alter table public.nodere_companies add column if not exists google_place_id text;

alter table public.nodere_searches add column if not exists results_count integer not null default 0;

alter table public.nodere_app_settings add column if not exists settings jsonb not null default '{}'::jsonb;

create index if not exists idx_nodere_companies_cnpj on public.nodere_companies(workspace_id, cnpj) where cnpj is not null and cnpj <> '';
create index if not exists idx_nodere_companies_place_id on public.nodere_companies(workspace_id, place_id) where place_id is not null and place_id <> '';
create index if not exists idx_nodere_companies_google_place_id on public.nodere_companies(workspace_id, google_place_id) where google_place_id is not null and google_place_id <> '';
create index if not exists idx_nodere_searches_results_count on public.nodere_searches(workspace_id, results_count);

comment on column public.nodere_companies.cnpj is 'CNPJ localizado por busca, importacao ou enriquecimento.';
comment on column public.nodere_companies.email_principal is 'Email principal localizado para ficha, CSV e PDF.';
comment on column public.nodere_companies.email_comercial is 'Email comercial localizado para ficha, CSV e PDF.';
comment on column public.nodere_companies.resumo is 'Resumo comercial da empresa exibido na ficha e exportacoes.';
comment on column public.nodere_companies.business_summary is 'Resumo comercial normalizado a partir das buscas e enriquecimentos.';
comment on column public.nodere_companies.resumo_sobre_empresa is 'Alias explicito para resumo sobre a empresa.';
comment on column public.nodere_searches.results_count is 'Quantidade de resultados temporarios retornados pela busca.';
comment on column public.nodere_app_settings.settings is 'Preferencias de tema, fonte, densidade, visual e demais configuracoes persistidas.';
