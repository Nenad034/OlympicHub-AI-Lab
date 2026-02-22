-- Create app_config table for dynamic settings
create table if not exists app_config (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- RLS for app_config (allow read/write for auth users for now)
alter table app_config enable row level security;

create policy "Allow all actions for authenticated users"
on app_config for all
to authenticated
using (true)
with check (true);

-- Create app_backups table for config snapshots
create table if not exists app_backups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  config jsonb not null,
  note text
);

-- RLS for app_backups
alter table app_backups enable row level security;

create policy "Allow all actions for authenticated users"
on app_backups for all
to authenticated
using (true)
with check (true);

-- Allow public read for demo purposes if needed (optional)
create policy "Allow public read"
on app_config for select
to anon
using (true);
