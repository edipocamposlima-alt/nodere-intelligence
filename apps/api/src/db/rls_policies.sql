-- NODERI Nexus - RLS complementar para persistencia multi-tenant
-- Aplicar no Supabase SQL Editor depois do schema principal.
-- Seguro para reexecucao: nao usa DROP TABLE nem DROP COLUMN.

create table if not exists nodere_companies (
  id text primary key,
  workspace_id text not null default 'default',
  name text not null,
  category text,
  city text,
  state text,
  address text,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  youtube text,
  rating numeric,
  review_count integer,
  maps_url text,
  cnpj text,
  legal_name text,
  latitude numeric,
  longitude numeric,
  status text not null default 'Novo Lead',
  score integer not null default 0,
  opportunity_level text not null default 'Baixa',
  enrichment_status text not null default 'none',
  last_contact_at timestamptz,
  detected_opportunities text[] not null default '{}',
  suggestions text[] not null default '{}',
  digital_signals jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nodere_company_notes (
  id text primary key default gen_random_uuid()::text,
  workspace_id text not null default 'default',
  company_id text not null references nodere_companies(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists nodere_app_settings (
  key text primary key,
  workspace_id text not null default 'default',
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_nodere_companies_workspace on nodere_companies(workspace_id);
create index if not exists idx_nodere_company_notes_workspace on nodere_company_notes(workspace_id);
create index if not exists idx_nodere_company_notes_company on nodere_company_notes(company_id);
create index if not exists idx_nodere_app_settings_workspace on nodere_app_settings(workspace_id);

alter table nodere_companies enable row level security;
alter table nodere_company_notes enable row level security;
alter table nodere_app_settings enable row level security;

-- Helper inline usado nas policies: workspace_id das tabelas NODERE e comparado como text
-- para compatibilidade com workspaces uuid e workspaces legados text.

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_companies' and policyname = 'nodere_companies_workspace_select') then
    create policy nodere_companies_workspace_select on nodere_companies
      for select using (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_companies.workspace_id
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_companies' and policyname = 'nodere_companies_workspace_insert') then
    create policy nodere_companies_workspace_insert on nodere_companies
      for insert with check (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_companies.workspace_id
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_companies' and policyname = 'nodere_companies_workspace_update') then
    create policy nodere_companies_workspace_update on nodere_companies
      for update using (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_companies.workspace_id
        )
      ) with check (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_companies.workspace_id
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_companies' and policyname = 'nodere_companies_workspace_delete') then
    create policy nodere_companies_workspace_delete on nodere_companies
      for delete using (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_companies.workspace_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_company_notes' and policyname = 'nodere_company_notes_workspace_all') then
    create policy nodere_company_notes_workspace_all on nodere_company_notes
      for all using (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_company_notes.workspace_id
        )
      ) with check (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_company_notes.workspace_id
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nodere_app_settings' and policyname = 'nodere_app_settings_workspace_all') then
    create policy nodere_app_settings_workspace_all on nodere_app_settings
      for all using (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_app_settings.workspace_id
        )
      ) with check (
        workspace_id = 'default'
        or exists (
          select 1 from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id::text = nodere_app_settings.workspace_id
        )
      );
  end if;
end $$;
