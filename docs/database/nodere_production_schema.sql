-- NODERE Intelligence - schema operacional de producao
-- Execute no Supabase SQL editor. O schema e incremental e nao remove dados.

create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  legal_name text,
  cnpj text,
  segment text,
  category text,
  address text,
  city text,
  state text,
  phone text,
  whatsapp text,
  email text,
  website text,
  google_maps_url text,
  rating numeric(3,2),
  review_count integer default 0,
  status text not null default 'Novo Lead',
  score integer not null default 0,
  opportunity_level text not null default 'Baixa',
  source text not null default 'manual',
  owner text,
  temperature text,
  estimated_value numeric(12,2),
  service_interest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text,
  role text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists decision_makers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  influence_level text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  note_type text not null default 'Observação',
  body text not null,
  owner text,
  origin text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  description text,
  activity_type text not null default 'follow-up',
  channel text,
  priority text not null default 'Média',
  status text not null default 'open',
  due_at timestamptz,
  completed_at timestamptz,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position integer not null,
  color text,
  is_won boolean not null default false,
  is_lost boolean not null default false
);

insert into pipeline_stages (name, position, color, is_won, is_lost)
values
  ('Novo Lead', 10, '#1E6FDB', false, false),
  ('Qualificado', 20, '#42D7FF', false, false),
  ('Contatado', 30, '#7C3AED', false, false),
  ('Diagnóstico enviado', 40, '#F4B740', false, false),
  ('Reunião marcada', 50, '#F97316', false, false),
  ('Proposta enviada', 60, '#06B6D4', false, false),
  ('Negociação', 70, '#A855F7', false, false),
  ('Fechado', 80, '#16C784', true, false),
  ('Perdido', 90, '#FF5A6A', false, true)
on conflict (name) do nothing;

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  content text not null,
  amount numeric(12,2),
  status text not null default 'draft',
  pdf_path text,
  whatsapp_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  content text not null,
  amount numeric(12,2),
  status text not null default 'draft',
  pdf_path text,
  whatsapp_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  body text not null,
  category text not null default 'Follow-up',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  proposal_id uuid references proposals(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  title text not null,
  file_name text,
  mime_type text,
  storage_path text,
  text_content text,
  file_type text not null default 'attachment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  id text primary key default 'default',
  theme text not null default 'Nodere Azul',
  color_primary text not null default '#1E6FDB',
  color_background text not null default '#0A0F1E',
  font_family text not null default 'Inter',
  layout_density text not null default 'compact',
  card_style text not null default 'cards',
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  action text not null,
  description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Compatibilidade com backend MVP atualmente publicado no Render.
create table if not exists mvp_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references mvp_leads(id) on delete cascade,
  document_type text not null default 'proposta',
  title text not null,
  content text not null,
  file_name text,
  mime_type text not null default 'application/pdf',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mvp_settings (
  id text primary key default 'default',
  theme text not null default 'Nodere Azul',
  color_primary text not null default '#1E6FDB',
  mode text not null default 'dark',
  font_family text not null default 'Inter',
  layout_density text not null default 'compact',
  card_style text not null default 'cards',
  updated_at timestamptz not null default now()
);

-- Configuracoes usadas pelo backend atual (apps/api).
-- Guarda preferencias publicas e etapas/cores do funil fora do navegador.
create table if not exists nodere_app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_companies_status on companies(status);
create index if not exists idx_companies_city_segment on companies(city, segment);
create index if not exists idx_notes_company_created on notes(company_id, created_at desc);
create index if not exists idx_activities_company_due on activities(company_id, due_at);
create index if not exists idx_proposals_company on proposals(company_id, created_at desc);
create index if not exists idx_contracts_company on contracts(company_id, created_at desc);
create index if not exists idx_files_company on files(company_id, created_at desc);
create index if not exists idx_mvp_documents_lead on mvp_documents(lead_id, created_at desc);
