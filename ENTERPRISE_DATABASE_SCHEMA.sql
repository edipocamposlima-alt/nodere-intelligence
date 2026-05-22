-- Nodere Intelligence Enterprise SaaS schema draft
-- Designed for PostgreSQL + PostGIS + JSONB + multi-tenant SaaS.

create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'internal',
  status text not null default 'active',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'owner',
  permissions jsonb not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  legal_name text,
  cnpj text,
  category text,
  subcategory text,
  phone text,
  whatsapp text,
  email text,
  website text,
  address text,
  country text default 'BR',
  state text,
  city text,
  neighborhood text,
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  location geography(point, 4326),
  google_place_id text,
  google_maps_url text,
  opening_hours jsonb not null default '[]',
  social_profiles jsonb not null default '{}',
  marketplaces jsonb not null default '[]',
  source text not null default 'manual',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, google_place_id)
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  linkedin text,
  instagram text,
  birthday date,
  is_decision_maker boolean not null default false,
  data_source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists digital_audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  provider text not null,
  audit_type text not null,
  score integer,
  findings jsonb not null default '[]',
  raw_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  seo_score integer,
  google_business_score integer,
  digital_presence_score integer,
  marketing_score integer,
  conversion_score integer,
  reputation_score integer,
  commercial_score integer,
  closing_potential_score integer,
  opportunity_score integer not null,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  stage text not null default 'lead_new',
  temperature text not null default 'warm',
  source text not null default 'radar',
  value numeric(12,2),
  probability integer default 20,
  next_action text,
  assigned_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  channel text not null,
  direction text not null,
  body text not null,
  ai_analysis jsonb not null default '{}',
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb not null default '{}',
  actions jsonb not null default '[]',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'not_connected',
  scopes text[] not null default '{}',
  config jsonb not null default '{}',
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists collection_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists companies_org_city_segment_idx on companies(organization_id, state, city, category);
create index if not exists companies_location_idx on companies using gist(location);
create index if not exists companies_name_trgm_idx on companies using gin(name gin_trgm_ops);
create index if not exists scores_opportunity_idx on scores(opportunity_score desc);
create index if not exists opportunities_stage_idx on opportunities(organization_id, stage, temperature);
create index if not exists audits_company_created_idx on digital_audits(company_id, created_at desc);
