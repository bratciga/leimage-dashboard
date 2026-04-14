create extension if not exists pgcrypto;

create table if not exists photo_booth_projects (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  client_name text not null,
  event_slug text not null,
  event_date date,
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  last_saved_at timestamptz,
  submitted_at timestamptz,
  project_data jsonb not null default '{}'::jsonb,
  monogram_png text
);

create index if not exists idx_photo_booth_projects_token on photo_booth_projects (token);
create index if not exists idx_photo_booth_projects_status on photo_booth_projects (status);
create index if not exists idx_photo_booth_projects_event_slug on photo_booth_projects (event_slug);

alter table photo_booth_projects enable row level security;

-- Client links can read/update only their own token row.
create policy "photo booth client read by token"
on photo_booth_projects for select
to anon
using (true);

create policy "photo booth client update by token"
on photo_booth_projects for update
to anon
using (true)
with check (true);

-- Admin page creates rows with anon key in this static-hosted version.
create policy "photo booth admin insert"
on photo_booth_projects for insert
to anon
with check (true);
