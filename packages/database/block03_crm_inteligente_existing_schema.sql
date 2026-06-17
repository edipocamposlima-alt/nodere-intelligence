-- BLOCO 03 - CRM Inteligente e Ficha de Lead
-- Adaptado ao schema real NODERE.
-- IMPORTANTE:
-- - Nao cria nodere_leads para evitar CRM paralelo.
-- - Fonte de verdade dos leads/clientes: public.nodere_companies.
-- - Contatos: public.company_contacts.
-- - Historico/atividades: public.communications.
-- - Catalogo: public.catalog_items.
-- - Negociacoes: public.company_contracts.

create extension if not exists pgcrypto;

alter table public.nodere_companies
  add column if not exists temperature text default 'Morno',
  add column if not exists probability integer default 0,
  add column if not exists deal_value numeric(12,2),
  add column if not exists expected_close_date date,
  add column if not exists lost_reason text,
  add column if not exists next_action text,
  add column if not exists owner_id text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_nodere_companies_workspace_status
  on public.nodere_companies(workspace_id, status, updated_at desc);

create index if not exists idx_nodere_companies_workspace_owner
  on public.nodere_companies(workspace_id, owner_id);

create index if not exists idx_nodere_companies_workspace_score
  on public.nodere_companies(workspace_id, score desc);

create table if not exists public.company_contacts (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  whatsapp text,
  email text,
  linkedin_url text,
  is_decision_maker boolean not null default false,
  notes text,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_contacts
  add column if not exists is_decision_maker boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_company_contacts_company
  on public.company_contacts(workspace_id, company_id);

create table if not exists public.communications (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text references public.nodere_companies(id) on delete cascade,
  contact_id text references public.company_contacts(id) on delete set null,
  type text not null default 'note',
  direction text not null default 'manual',
  subject text,
  body text,
  sent_by text,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_communications_company
  on public.communications(workspace_id, company_id, sent_at desc);

create index if not exists idx_communications_type
  on public.communications(workspace_id, type);

create table if not exists public.catalog_items (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  code text not null,
  name text not null,
  commercial_name text,
  category text not null default 'CRM',
  subcategory text,
  brand text,
  type text not null default 'service',
  status text not null default 'active',
  description_short text,
  description_full text,
  price numeric not null default 0,
  cost numeric not null default 0,
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

alter table public.catalog_items
  add column if not exists currency text not null default 'BRL',
  add column if not exists price_type text not null default 'fixed',
  add column if not exists image_url text,
  add column if not exists images text[] not null default '{}';

create index if not exists idx_catalog_items_workspace
  on public.catalog_items(workspace_id, status, category);

create table if not exists public.company_contracts (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references public.nodere_companies(id) on delete cascade,
  catalog_item_id text references public.catalog_items(id) on delete restrict,
  quantity integer not null default 1,
  contracted_price numeric not null default 0,
  discount_pct numeric,
  contracted_at date not null default current_date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_contracts
  alter column catalog_item_id drop not null,
  add column if not exists item_name text,
  add column if not exists item_type text default 'service',
  add column if not exists description text,
  add column if not exists unit_price numeric(12,2),
  add column if not exists total_price numeric(12,2),
  add column if not exists currency text not null default 'BRL',
  add column if not exists started_at date,
  add column if not exists ended_at date;

create index if not exists idx_company_contracts_company
  on public.company_contracts(workspace_id, company_id);

create or replace function public.nodere_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists nodere_companies_touch_updated_at on public.nodere_companies;
create trigger nodere_companies_touch_updated_at
before update on public.nodere_companies
for each row execute function public.nodere_touch_updated_at();

drop trigger if exists company_contacts_touch_updated_at on public.company_contacts;
create trigger company_contacts_touch_updated_at
before update on public.company_contacts
for each row execute function public.nodere_touch_updated_at();

drop trigger if exists catalog_items_touch_updated_at on public.catalog_items;
create trigger catalog_items_touch_updated_at
before update on public.catalog_items
for each row execute function public.nodere_touch_updated_at();

drop trigger if exists company_contracts_touch_updated_at on public.company_contracts;
create trigger company_contracts_touch_updated_at
before update on public.company_contracts
for each row execute function public.nodere_touch_updated_at();
