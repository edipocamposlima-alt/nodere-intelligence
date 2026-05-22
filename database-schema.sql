-- Nodere Intelligence - PostgreSQL baseline schema
-- Multi-tenant SaaS model prepared for auth, permissions, lead intelligence, CRM, Google, WhatsApp and billing.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter',
  credits_balance integer not null default 0,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'sdr',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table module_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  module_key text not null,
  can_access boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);

create table invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'sdr',
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_name text not null,
  legal_name text,
  cnpj text,
  phone text,
  whatsapp text,
  email text,
  website text,
  city text,
  state text,
  segment text,
  company_size text,
  source text not null default 'manual',
  status text not null default 'new',
  assigned_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table digital_audits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  has_website boolean,
  has_whatsapp boolean,
  has_google_ads boolean,
  has_meta_pixel boolean,
  has_gtm boolean,
  has_ga4 boolean,
  has_conversion_tracking boolean,
  seo_score integer,
  speed_score integer,
  google_rating numeric(3,2),
  google_reviews integer,
  findings jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  opportunity_score integer not null,
  maturity_score integer not null,
  commercial_score integer not null,
  paid_traffic_score integer not null,
  explanation text,
  created_at timestamptz not null default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  stage text not null default 'lead_new',
  value numeric(12,2),
  probability integer not null default 20,
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id),
  channel text not null,
  direction text not null,
  body text not null,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  assigned_user_id uuid references users(id),
  title text not null,
  due_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table google_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  account_id text,
  status text not null default 'not_connected',
  scopes text[] not null default '{}',
  connected_at timestamptz
);

create table whatsapp_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  phone_number_id text,
  business_account_id text,
  display_phone text,
  status text not null default 'not_connected',
  connected_at timestamptz
);

create table credit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type text not null,
  amount integer not null,
  description text,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  description text not null,
  amount numeric(12,2) not null,
  status text not null default 'open',
  issued_at timestamptz not null default now()
);

create index idx_leads_org_status on leads(organization_id, status);
create index idx_leads_city_segment on leads(city, segment);
create index idx_interactions_lead_created on interactions(lead_id, created_at desc);
create index idx_tasks_org_status_due on tasks(organization_id, status, due_at);
