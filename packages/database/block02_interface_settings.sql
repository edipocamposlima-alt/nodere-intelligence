create table if not exists nodere_workspace_settings (
  id uuid default gen_random_uuid() primary key,
  workspace_id text references nodere_workspaces(id) on delete cascade,
  key text not null,
  value text,
  masked_value text,
  updated_at timestamptz default now(),
  unique(workspace_id, key)
);

alter table nodere_workspace_settings enable row level security;
