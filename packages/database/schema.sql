CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(80) UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id VARCHAR(255) UNIQUE,
  name VARCHAR(220) NOT NULL,
  category VARCHAR(160),
  city VARCHAR(120),
  state VARCHAR(80),
  address TEXT,
  phone VARCHAR(60),
  whatsapp VARCHAR(60),
  website TEXT,
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0,
  maps_url TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  has_google_ads BOOLEAN DEFAULT FALSE,
  has_description BOOLEAN DEFAULT FALSE,
  has_recent_photos BOOLEAN DEFAULT FALSE,
  has_recent_posts BOOLEAN DEFAULT FALSE,
  responds_reviews BOOLEAN DEFAULT FALSE,
  has_ssl BOOLEAN DEFAULT FALSE,
  is_responsive BOOLEAN DEFAULT FALSE,
  page_speed INTEGER DEFAULT 0,
  meta_pixel BOOLEAN DEFAULT FALSE,
  google_tag_manager BOOLEAN DEFAULT FALSE,
  google_analytics BOOLEAN DEFAULT FALSE,
  seo_basics BOOLEAN DEFAULT FALSE,
  crm_status_id UUID REFERENCES crm_status(id),
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  opportunity_level VARCHAR(20) NOT NULL,
  detected_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel VARCHAR(40) NOT NULL,
  value TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(80) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  city VARCHAR(120) NOT NULL,
  state VARCHAR(80),
  segment VARCHAR(160) NOT NULL,
  keyword VARCHAR(180),
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO crm_status (name, sort_order)
VALUES
  ('Novo Lead', 10),
  ('Contatado', 20),
  ('Em negociação', 30),
  ('Reunião marcada', 40),
  ('Proposta enviada', 50),
  ('Fechado', 60),
  ('Perdido', 70)
ON CONFLICT (name) DO NOTHING;
