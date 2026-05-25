-- Nodere Intelligence MVP schema
-- Use this first for personal use. It is intentionally simpler than the full SaaS schema.

create extension if not exists pgcrypto;

create table if not exists mvp_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  google_place_id text,
  phone text,
  whatsapp text,
  website text,
  address text,
  city text,
  state text,
  segment text,
  google_rating numeric(3,2),
  google_reviews integer not null default 0,
  google_maps_url text,
  status text not null default 'lead_new',
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mvp_site_scans (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references mvp_leads(id) on delete cascade,
  website text,
  score integer,
  scan_result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists mvp_diagnoses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references mvp_leads(id) on delete cascade,
  opportunity_score numeric,
  diagnosis jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists mvp_crm_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references mvp_leads(id) on delete cascade,
  event_type text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists mvp_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references mvp_leads(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mvp_searches (
  id uuid primary key default gen_random_uuid(),
  city text,
  state text,
  segment text,
  keyword text,
  provider text not null default 'google_places',
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists mvp_leads_status_idx on mvp_leads(status);
create index if not exists mvp_leads_city_segment_idx on mvp_leads(city, segment);
create index if not exists mvp_site_scans_lead_idx on mvp_site_scans(lead_id, created_at desc);
create index if not exists mvp_diagnoses_lead_idx on mvp_diagnoses(lead_id, created_at desc);
create index if not exists mvp_tasks_lead_idx on mvp_tasks(lead_id, due_at);
create index if not exists mvp_searches_created_idx on mvp_searches(created_at desc);
