-- NR Wish List: run this whole script in Supabase SQL Editor.
-- The app intentionally uses one shared couple_id for this simple version.

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  title text not null,
  description text,
  tags text[] not null default '{}',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  proposed_by text not null default 'both' check (proposed_by in ('me', 'gf', 'both')),
  assigned_to text not null default 'both' check (assigned_to in ('me', 'gf', 'both')),
  deadline date,
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now(),
  completed_count integer not null default 0,
  history jsonb not null default '[]'::jsonb
);

create table if not exists public.wish_tags (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  name text not null,
  created_at timestamptz not null default now(),
  unique (couple_id, name)
);

alter table public.wishes enable row level security;
alter table public.wish_tags enable row level security;

-- Simple shared-couple mode. Replace these policies with auth.uid()-based
-- policies before storing sensitive/private data.
drop policy if exists "shared couple can read wishes" on public.wishes;
drop policy if exists "shared couple can insert wishes" on public.wishes;
drop policy if exists "shared couple can update wishes" on public.wishes;
drop policy if exists "shared couple can delete wishes" on public.wishes;
drop policy if exists "shared couple can read tags" on public.wish_tags;
drop policy if exists "shared couple can insert tags" on public.wish_tags;
drop policy if exists "shared couple can delete tags" on public.wish_tags;

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
end $$;
