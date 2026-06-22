-- NODERE - CMS administrativo incremental
-- Aplicar manualmente no Supabase SQL Editor. Nao apaga dados nem duplica users/workspaces.

create extension if not exists pgcrypto;

create table if not exists public.nodere_cms_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'default',
  slug text not null,
  title text not null,
  subtitle text,
  page_type text not null default 'institutional',
  status text not null default 'draft' check (status in ('draft','published','hidden')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, slug)
);

create table if not exists public.nodere_cms_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'default',
  page_id uuid not null references public.nodere_cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null default 'content',
  title text,
  subtitle text,
  body text,
  image_url text,
  button_label text,
  button_href text,
  settings jsonb not null default '{}',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, section_key)
);

create table if not exists public.nodere_cms_navigation (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'default',
  location text not null default 'header' check (location in ('header','footer','app')),
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodere_cms_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'default',
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodere_cms_pages_workspace on public.nodere_cms_pages(workspace_id, status, slug);
create index if not exists idx_nodere_cms_sections_page on public.nodere_cms_sections(workspace_id, page_id, sort_order);
create index if not exists idx_nodere_cms_navigation_location on public.nodere_cms_navigation(workspace_id, location, sort_order);
create index if not exists idx_nodere_cms_assets_workspace on public.nodere_cms_assets(workspace_id, created_at desc);

alter table public.nodere_cms_pages enable row level security;
alter table public.nodere_cms_sections enable row level security;
alter table public.nodere_cms_navigation enable row level security;
alter table public.nodere_cms_assets enable row level security;

revoke insert, update, delete on public.nodere_cms_pages from anon, authenticated;
revoke insert, update, delete on public.nodere_cms_sections from anon, authenticated;
revoke insert, update, delete on public.nodere_cms_navigation from anon, authenticated;
revoke all on public.nodere_cms_assets from anon, authenticated;
grant select on public.nodere_cms_pages, public.nodere_cms_sections, public.nodere_cms_navigation to anon, authenticated;

drop policy if exists nodere_cms_pages_public_read on public.nodere_cms_pages;
create policy nodere_cms_pages_public_read on public.nodere_cms_pages for select using (workspace_id = 'default' and status = 'published');
drop policy if exists nodere_cms_sections_public_read on public.nodere_cms_sections;
create policy nodere_cms_sections_public_read on public.nodere_cms_sections for select using (
  workspace_id = 'default' and visible = true and exists (
    select 1 from public.nodere_cms_pages p
    where p.id = page_id and p.status = 'published'
  )
);
drop policy if exists nodere_cms_navigation_public_read on public.nodere_cms_navigation;
create policy nodere_cms_navigation_public_read on public.nodere_cms_navigation for select using (workspace_id = 'default' and visible = true);

create or replace function public.nodere_cms_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists nodere_cms_pages_touch on public.nodere_cms_pages;
create trigger nodere_cms_pages_touch before update on public.nodere_cms_pages for each row execute function public.nodere_cms_touch_updated_at();
drop trigger if exists nodere_cms_sections_touch on public.nodere_cms_sections;
create trigger nodere_cms_sections_touch before update on public.nodere_cms_sections for each row execute function public.nodere_cms_touch_updated_at();
drop trigger if exists nodere_cms_navigation_touch on public.nodere_cms_navigation;
create trigger nodere_cms_navigation_touch before update on public.nodere_cms_navigation for each row execute function public.nodere_cms_touch_updated_at();

insert into public.nodere_cms_pages (workspace_id, slug, title, subtitle, page_type, status)
values ('default', 'home', 'NODERE', 'Inteligencia comercial, CRM e IA', 'home', 'published'),
       ('default', 'manual', 'Manual NODERE', 'Ajuda e orientacoes da plataforma', 'manual', 'published')
on conflict (workspace_id, slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
