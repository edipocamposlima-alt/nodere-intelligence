-- NODERE Nexus - Migracao UUID definitiva para Supabase Auth.
-- Schema real confirmado:
--   public.nodere_workspaces:
--     id, nome, plano, creditos, expira_em, criado_em, atualizado_em
--   public.nodere_platform_users:
--     id, workspace_id, name, email, role, active, password_hash, auth_user_id,
--     created_at, updated_at
--
-- Tabelas existentes utilizadas:
--   public.nodere_workspaces
--   public.nodere_platform_users
--   public.nodere_workspace_modules
--
-- Nao cria public.users.
-- Nao cria public.workspaces.
-- Nao apaga registros.
-- Nao remove password_hash nesta etapa.
--
-- Pre-requisitos obrigatorios:
--   usuarios_sem_auth = 0
--   usuarios_sem_workspace = 0
--   nodere_platform_users.auth_user_id preenchido para todos os usuarios ativos

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- 1. BACKUP LOGICO E COLUNAS AUXILIARES
-- ============================================================

alter table public.nodere_workspaces
  add column if not exists legacy_id text,
  add column if not exists uuid_id uuid;

alter table public.nodere_platform_users
  add column if not exists legacy_id text,
  add column if not exists legacy_workspace_id text,
  add column if not exists uuid_id uuid,
  add column if not exists workspace_uuid_id uuid,
  add column if not exists auth_imported_at timestamptz,
  add column if not exists auth_import_error text,
  add column if not exists avatar_url text,
  add column if not exists invited_by uuid,
  add column if not exists last_seen_at timestamptz;

alter table public.nodere_workspace_modules
  add column if not exists legacy_workspace_id text,
  add column if not exists workspace_uuid_id uuid,
  add column if not exists active boolean default true,
  add column if not exists activated_at timestamptz default now();

update public.nodere_workspaces
set legacy_id = id
where legacy_id is null;

update public.nodere_workspaces
set uuid_id =
  case
    when id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then id::uuid
    else gen_random_uuid()
  end
where uuid_id is null;

update public.nodere_platform_users
set legacy_id = id
where legacy_id is null;

update public.nodere_platform_users
set legacy_workspace_id = workspace_id
where legacy_workspace_id is null;

update public.nodere_platform_users u
set auth_user_id = au.id
from auth.users au
where u.auth_user_id is null
  and lower(u.email) = lower(au.email);

update public.nodere_platform_users u
set workspace_uuid_id = w.uuid_id
from public.nodere_workspaces w
where u.workspace_uuid_id is null
  and u.workspace_id = w.legacy_id;

update public.nodere_platform_users
set uuid_id = auth_user_id
where uuid_id is null
  and auth_user_id is not null;

update public.nodere_workspace_modules
set legacy_workspace_id = workspace_id::text
where legacy_workspace_id is null;

update public.nodere_workspace_modules m
set workspace_uuid_id = w.uuid_id
from public.nodere_workspaces w
where m.workspace_uuid_id is null
  and m.legacy_workspace_id = w.legacy_id;

update public.nodere_workspace_modules
set workspace_uuid_id = workspace_id::uuid
where workspace_uuid_id is null
  and workspace_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

update public.nodere_platform_users
set role = case lower(role)
  when 'administrador' then 'admin'
  when 'dono' then 'owner'
  when 'gerente' then 'manager'
  when 'operador' then 'operator'
  when 'visualizador' then 'viewer'
  else lower(role)
end
where role is not null;

-- ============================================================
-- 2. BLOQUEIOS DE SEGURANCA
-- ============================================================

do $$
begin
  if exists (
    select 1
    from public.nodere_platform_users
    where active = true
      and auth_user_id is null
  ) then
    raise exception 'Migracao bloqueada: existem usuarios ativos sem auth_user_id.';
  end if;

  if exists (
    select 1
    from public.nodere_platform_users
    where active = true
      and auth_user_id not in (select id from auth.users)
  ) then
    raise exception 'Migracao bloqueada: existem auth_user_id sem correspondente em auth.users.';
  end if;

  if exists (
    select 1
    from public.nodere_platform_users
    where workspace_uuid_id is null
  ) then
    raise exception 'Migracao bloqueada: existem usuarios sem workspace_uuid_id.';
  end if;

  if exists (
    select 1
    from public.nodere_workspace_modules
    where workspace_uuid_id is null
  ) then
    raise exception 'Migracao bloqueada: existem modulos sem workspace_uuid_id.';
  end if;

  if exists (
    select uuid_id
    from public.nodere_workspaces
    group by uuid_id
    having count(*) > 1
  ) then
    raise exception 'Migracao bloqueada: uuid_id duplicado em nodere_workspaces.';
  end if;

  if exists (
    select uuid_id
    from public.nodere_platform_users
    group by uuid_id
    having count(*) > 1
  ) then
    raise exception 'Migracao bloqueada: uuid_id duplicado em nodere_platform_users.';
  end if;
end $$;

-- ============================================================
-- 3. REMOVER CONSTRAINTS DEPENDENTES SEM REMOVER DADOS
-- ============================================================

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'f'
      and confrelid in (
        'public.nodere_workspaces'::regclass,
        'public.nodere_platform_users'::regclass
      )
  loop
    execute format(
      'alter table %s drop constraint if exists %I',
      constraint_record.table_name,
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.nodere_platform_users
  drop constraint if exists nodere_platform_users_pkey;

alter table public.nodere_workspaces
  drop constraint if exists nodere_workspaces_pkey;

-- ============================================================
-- 4. CONVERTER CHAVES PRINCIPAIS PARA UUID
-- ============================================================

alter table public.nodere_workspaces
  alter column id drop default;

alter table public.nodere_platform_users
  alter column id drop default,
  alter column workspace_id drop default;

alter table public.nodere_workspace_modules
  alter column workspace_id drop default;

alter table public.nodere_workspaces
  alter column id type uuid using uuid_id;

alter table public.nodere_platform_users
  alter column id type uuid using uuid_id,
  alter column workspace_id type uuid using workspace_uuid_id;

alter table public.nodere_workspace_modules
  alter column workspace_id type uuid using workspace_uuid_id;

alter table public.nodere_workspaces
  alter column id set default gen_random_uuid();

alter table public.nodere_platform_users
  alter column id set not null,
  alter column workspace_id set not null,
  alter column auth_user_id set not null;

alter table public.nodere_workspace_modules
  alter column workspace_id set not null;

alter table public.nodere_workspaces
  add constraint nodere_workspaces_pkey primary key (id);

alter table public.nodere_platform_users
  add constraint nodere_platform_users_pkey primary key (id);

alter table public.nodere_platform_users
  add constraint nodere_platform_users_auth_user_fkey
  foreign key (id) references auth.users(id) on delete cascade;

alter table public.nodere_platform_users
  add constraint nodere_platform_users_auth_user_id_match
  check (id = auth_user_id);

alter table public.nodere_platform_users
  add constraint nodere_platform_users_workspace_id_fkey
  foreign key (workspace_id) references public.nodere_workspaces(id) on delete cascade;

alter table public.nodere_workspace_modules
  add constraint nodere_workspace_modules_workspace_id_fkey
  foreign key (workspace_id) references public.nodere_workspaces(id) on delete cascade;

create index if not exists idx_nodere_platform_users_workspace_id
  on public.nodere_platform_users(workspace_id);

create unique index if not exists idx_nodere_workspace_modules_unique
  on public.nodere_workspace_modules(workspace_id, module_code);

-- ============================================================
-- 5. GARANTIR MODULOS TRIAL/STARTER
-- ============================================================

insert into public.nodere_workspace_modules (workspace_id, module_code, active)
select w.id, starter_modules.module_code, true
from public.nodere_workspaces w
cross join (
  values
    ('DISC-01'),
    ('DISC-02'),
    ('DISC-03'),
    ('DISC-04'),
    ('DISC-05'),
    ('CRM-01'),
    ('CRM-02'),
    ('CRM-03'),
    ('ANA-01')
) as starter_modules(module_code)
on conflict (workspace_id, module_code) do update set active = true;

-- ============================================================
-- 6. TRIGGER PARA NOVOS USUARIOS VIA SUPABASE AUTH
-- ============================================================

create or replace function public.nodere_handle_new_user()
returns trigger as $$
declare
  target_workspace_id uuid;
  target_role text;
begin
  target_workspace_id := nullif(new.raw_user_meta_data->>'workspace_id', '')::uuid;
  target_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'operator');

  target_role := case lower(target_role)
    when 'administrador' then 'admin'
    when 'dono' then 'owner'
    when 'gerente' then 'manager'
    when 'operador' then 'operator'
    when 'visualizador' then 'viewer'
    else lower(target_role)
  end;

  if target_workspace_id is null then
    target_workspace_id := gen_random_uuid();

    insert into public.nodere_workspaces (
      id,
      legacy_id,
      nome,
      plano,
      creditos,
      expira_em,
      criado_em,
      atualizado_em
    )
    values (
      target_workspace_id,
      target_workspace_id::text,
      coalesce(new.raw_user_meta_data->>'company', split_part(new.email, '@', 1)),
      'trial',
      0,
      now() + interval '14 days',
      now(),
      now()
    );

    insert into public.nodere_workspace_modules (workspace_id, module_code, active)
    values
      (target_workspace_id, 'DISC-01', true),
      (target_workspace_id, 'DISC-02', true),
      (target_workspace_id, 'DISC-03', true),
      (target_workspace_id, 'DISC-04', true),
      (target_workspace_id, 'DISC-05', true),
      (target_workspace_id, 'CRM-01', true),
      (target_workspace_id, 'CRM-02', true),
      (target_workspace_id, 'CRM-03', true),
      (target_workspace_id, 'ANA-01', true)
    on conflict (workspace_id, module_code) do update set active = true;

    target_role := 'owner';
  end if;

  insert into public.nodere_platform_users (
    id,
    legacy_id,
    workspace_id,
    legacy_workspace_id,
    auth_user_id,
    name,
    email,
    role,
    active,
    password_hash,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.id::text,
    target_workspace_id,
    target_workspace_id::text,
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    target_role,
    true,
    null,
    now(),
    now()
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    auth_user_id = excluded.auth_user_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    active = true,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.nodere_handle_new_user();

-- ============================================================
-- 7. RLS
-- ============================================================

alter table public.nodere_workspaces enable row level security;
alter table public.nodere_platform_users enable row level security;
alter table public.nodere_workspace_modules enable row level security;

drop policy if exists "nodere_workspaces_self" on public.nodere_workspaces;
create policy "nodere_workspaces_self" on public.nodere_workspaces
  for all using (
    id in (
      select workspace_id
      from public.nodere_platform_users
      where id = auth.uid()
    )
  );

drop policy if exists "nodere_platform_users_same_workspace" on public.nodere_platform_users;
create policy "nodere_platform_users_same_workspace" on public.nodere_platform_users
  for all using (
    workspace_id in (
      select workspace_id
      from public.nodere_platform_users
      where id = auth.uid()
    )
  );

drop policy if exists "nodere_workspace_modules_isolation" on public.nodere_workspace_modules;
create policy "nodere_workspace_modules_isolation" on public.nodere_workspace_modules
  for all using (
    workspace_id in (
      select workspace_id
      from public.nodere_platform_users
      where id = auth.uid()
    )
  );

comment on column public.nodere_platform_users.password_hash is
  'LEGACY: nao usar para login. Autenticacao oficial via Supabase Auth. Remover somente apos validacao completa.';

commit;

-- Checagens pos-migracao:
-- select count(*) as usuarios_sem_auth
-- from public.nodere_platform_users
-- where active = true
--   and id not in (select id from auth.users);
--
-- select count(*) as usuarios_sem_workspace
-- from public.nodere_platform_users u
-- left join public.nodere_workspaces w on w.id = u.workspace_id
-- where u.active = true
--   and w.id is null;
--
-- select id, name, email, role, workspace_id
-- from public.nodere_platform_users
-- order by created_at;
