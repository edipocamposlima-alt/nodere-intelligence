-- NODERE Intelligence — apps/api schema
-- Execute no Supabase SQL editor ou via psql DATABASE_URL

create extension if not exists pgcrypto;

-- Empresas / leads
create table if not exists nodere_companies (
  id text primary key,
  name text not null,
  category text not null default '',
  city text not null default '',
  state text not null default '',
  address text not null default '',
  phone text,
  whatsapp text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  youtube text,
  rating numeric(3,2),
  review_count integer,
  maps_url text,
  latitude numeric,
  longitude numeric,
  status text not null default 'Novo Lead',
  score integer not null default 0,
  opportunity_level text not null default 'Baixa',
  enrichment_status text not null default 'none',
  last_contact_at timestamptz,
  -- jsonb para sinais digitais e scores compostos
  digital_signals jsonb not null default '{}',
  detected_opportunities jsonb not null default '[]',
  suggestions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notas CRM de cada empresa
create table if not exists nodere_company_notes (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references nodere_companies(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Histórico de buscas realizadas
create table if not exists nodere_searches (
  id text primary key default gen_random_uuid()::text,
  city text not null,
  state text,
  segment text not null,
  keyword text,
  result_count integer not null default 0,
  source text not null default 'mock',
  company_ids jsonb not null default '[]',
  created_at timestamptz not null default now(),
  last_ran_at timestamptz not null default now()
);

-- Índices para queries frequentes
create index if not exists idx_companies_city_state on nodere_companies(city, state);
create index if not exists idx_companies_status on nodere_companies(status);
create index if not exists idx_companies_score on nodere_companies(score desc);
create index if not exists idx_notes_company on nodere_company_notes(company_id);
create index if not exists idx_searches_created on nodere_searches(created_at desc);
