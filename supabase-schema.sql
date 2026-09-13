-- NR Wish List: run this whole script in Supabase SQL Editor.
-- The app intentionally uses one shared couple_id for this simple version.

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  title text not null,
  description text,
  region text,
  address text,
  tags text[] not null default '{}',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  proposed_by text not null default 'both' check (proposed_by in ('Remus', 'Nicole', 'both')),
  assigned_to text not null default 'both' check (assigned_to in ('me', 'gf', 'both')),
  deadline date,
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now(),
  completed_count integer not null default 0,
  history jsonb not null default '[]'::jsonb
);

alter table public.wishes add column if not exists region text;
alter table public.wishes add column if not exists address text;

-- Migrate the original proposer values to account names.
alter table public.wishes drop constraint if exists wishes_proposed_by_check;
update public.wishes set proposed_by = 'Remus' where proposed_by = 'me';
update public.wishes set proposed_by = 'Nicole' where proposed_by = 'gf';
alter table public.wishes add constraint wishes_proposed_by_check
  check (proposed_by in ('Remus', 'Nicole', 'both'));

create table if not exists public.wish_tags (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  name text not null,
  created_at timestamptz not null default now(),
  unique (couple_id, name)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  title text not null,
  start_date date not null,
  end_date date not null,
  is_all_day boolean not null default true,
  start_time time,
  end_time time,
  location text,
  created_by text not null check (created_by in ('Remus', 'Nicole')),
  is_romantic boolean not null default false,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (is_all_day or start_time is not null or end_time is not null)
);

-- Include couple_id in DELETE payloads so filtered Realtime subscribers refresh.
alter table public.calendar_events replica identity full;

alter table public.wishes enable row level security;
alter table public.wish_tags enable row level security;
alter table public.calendar_events enable row level security;

-- Simple shared-couple mode. Replace these policies with auth.uid()-based
-- policies before storing sensitive/private data.
drop policy if exists "shared couple can read wishes" on public.wishes;
drop policy if exists "shared couple can insert wishes" on public.wishes;
drop policy if exists "shared couple can update wishes" on public.wishes;
drop policy if exists "shared couple can delete wishes" on public.wishes;
drop policy if exists "shared couple can read tags" on public.wish_tags;
drop policy if exists "shared couple can insert tags" on public.wish_tags;
drop policy if exists "shared couple can delete tags" on public.wish_tags;
drop policy if exists "shared couple can read calendar events" on public.calendar_events;
drop policy if exists "shared couple can insert calendar events" on public.calendar_events;
drop policy if exists "shared couple can update calendar events" on public.calendar_events;
drop policy if exists "shared couple can delete calendar events" on public.calendar_events;

create policy "shared couple can read wishes" on public.wishes
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert wishes" on public.wishes
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can update wishes" on public.wishes
  for update to anon, authenticated
  using (couple_id = 'remus-nicole') with check (couple_id = 'remus-nicole');
create policy "shared couple can delete wishes" on public.wishes
  for delete to anon, authenticated using (couple_id = 'remus-nicole');

create policy "shared couple can read tags" on public.wish_tags
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert tags" on public.wish_tags
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can delete tags" on public.wish_tags
  for delete to anon, authenticated using (couple_id = 'remus-nicole');

create policy "shared couple can read calendar events" on public.calendar_events
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert calendar events" on public.calendar_events
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can update calendar events" on public.calendar_events
  for update to anon, authenticated
  using (couple_id = 'remus-nicole') with check (couple_id = 'remus-nicole');
create policy "shared couple can delete calendar events" on public.calendar_events
  for delete to anon, authenticated using (couple_id = 'remus-nicole');

insert into public.wish_tags (couple_id, name) values
  ('remus-nicole', '約會'), ('remus-nicole', '禮物'),
  ('remus-nicole', '旅行'), ('remus-nicole', '日常生活'),
  ('remus-nicole', '驚喜'), ('remus-nicole', '美食'), ('remus-nicole', '浪漫')
on conflict (couple_id, name) do nothing;

-- Enable Realtime for cross-device updates. Safe to run repeatedly.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wishes'
  ) then
    alter publication supabase_realtime add table public.wishes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wish_tags'
  ) then
    alter publication supabase_realtime add table public.wish_tags;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_events'
  ) then
    alter publication supabase_realtime add table public.calendar_events;
  end if;
end $$;
