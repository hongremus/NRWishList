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

create table if not exists public.house_rules (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  rule_number integer not null check (rule_number between 1 and 10),
  text text not null default '',
  updated_by text check (updated_by in ('Remus', 'Nicole')),
  updated_at timestamptz not null default now(),
  unique (couple_id, rule_number)
);

create table if not exists public.house_rule_proposals (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  rule_number integer not null check (rule_number between 1 and 10),
  current_text text not null default '',
  proposed_text text not null default '',
  proposed_by text not null check (proposed_by in ('Remus', 'Nicole')),
  remus_approved boolean not null default false,
  nicole_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (couple_id, rule_number)
);

create table if not exists public.crime_records (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  incident_date date not null,
  offender text not null check (offender in ('Remus', 'Nicole')),
  rule_number integer check (rule_number between 1 and 10),
  description text not null,
  status text not null default '未處理' check (status in ('未處理', '已道歉', '已補償', '已處理')),
  punishment text not null default '',
  recorded_by text not null check (recorded_by in ('Remus', 'Nicole')),
  confirmed_by text not null check (confirmed_by in ('Remus', 'Nicole')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz not null default now()
);

create table if not exists public.crime_record_proposals (
  id uuid primary key default gen_random_uuid(),
  couple_id text not null default 'remus-nicole',
  incident_date date not null,
  offender text not null check (offender in ('Remus', 'Nicole')),
  rule_number integer check (rule_number between 1 and 10),
  description text not null,
  status text not null default '未處理' check (status in ('未處理', '已道歉', '已補償', '已處理')),
  punishment text not null default '',
  proposed_by text not null check (proposed_by in ('Remus', 'Nicole')),
  created_at timestamptz not null default now()
);

-- Add crime status and punishment fields to databases created before v1.3.0.
alter table public.crime_records
  add column if not exists status text not null default '未處理';
alter table public.crime_records
  add column if not exists punishment text not null default '';
alter table public.crime_record_proposals
  add column if not exists status text not null default '未處理';
alter table public.crime_record_proposals
  add column if not exists punishment text not null default '';

create index if not exists wishes_couple_created_at_idx
  on public.wishes (couple_id, created_at desc);

create index if not exists calendar_events_couple_dates_idx
  on public.calendar_events (couple_id, start_date, start_time);

create index if not exists calendar_events_couple_end_date_idx
  on public.calendar_events (couple_id, end_date);

-- Include couple_id in DELETE payloads so filtered Realtime subscribers refresh.
alter table public.calendar_events replica identity full;

alter table public.wishes enable row level security;
alter table public.wish_tags enable row level security;
alter table public.calendar_events enable row level security;
alter table public.house_rules enable row level security;
alter table public.house_rule_proposals enable row level security;
alter table public.crime_records enable row level security;
alter table public.crime_record_proposals enable row level security;

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
drop policy if exists "shared couple can read house rules" on public.house_rules;
drop policy if exists "shared couple can insert house rules" on public.house_rules;
drop policy if exists "shared couple can update house rules" on public.house_rules;
drop policy if exists "shared couple can read house rule proposals" on public.house_rule_proposals;
drop policy if exists "shared couple can insert house rule proposals" on public.house_rule_proposals;
drop policy if exists "shared couple can update house rule proposals" on public.house_rule_proposals;
drop policy if exists "shared couple can delete house rule proposals" on public.house_rule_proposals;
drop policy if exists "shared couple can read crime records" on public.crime_records;
drop policy if exists "shared couple can insert crime records" on public.crime_records;
drop policy if exists "shared couple can update crime records" on public.crime_records;
drop policy if exists "shared couple can read crime record proposals" on public.crime_record_proposals;
drop policy if exists "shared couple can insert crime record proposals" on public.crime_record_proposals;
drop policy if exists "shared couple can delete crime record proposals" on public.crime_record_proposals;

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

create policy "shared couple can read house rules" on public.house_rules
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert house rules" on public.house_rules
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can update house rules" on public.house_rules
  for update to anon, authenticated
  using (couple_id = 'remus-nicole') with check (couple_id = 'remus-nicole');

create policy "shared couple can read house rule proposals" on public.house_rule_proposals
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert house rule proposals" on public.house_rule_proposals
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can update house rule proposals" on public.house_rule_proposals
  for update to anon, authenticated
  using (couple_id = 'remus-nicole') with check (couple_id = 'remus-nicole');
create policy "shared couple can delete house rule proposals" on public.house_rule_proposals
  for delete to anon, authenticated using (couple_id = 'remus-nicole');

create policy "shared couple can read crime records" on public.crime_records
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert crime records" on public.crime_records
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can update crime records" on public.crime_records
  for update to anon, authenticated
  using (couple_id = 'remus-nicole') with check (couple_id = 'remus-nicole');

create policy "shared couple can read crime record proposals" on public.crime_record_proposals
  for select to anon, authenticated using (couple_id = 'remus-nicole');
create policy "shared couple can insert crime record proposals" on public.crime_record_proposals
  for insert to anon, authenticated with check (couple_id = 'remus-nicole');
create policy "shared couple can delete crime record proposals" on public.crime_record_proposals
  for delete to anon, authenticated using (couple_id = 'remus-nicole');

insert into public.wish_tags (couple_id, name) values
  ('remus-nicole', '約會'), ('remus-nicole', '禮物'),
  ('remus-nicole', '旅行'), ('remus-nicole', '日常生活'),
  ('remus-nicole', '驚喜'), ('remus-nicole', '美食'), ('remus-nicole', '浪漫')
on conflict (couple_id, name) do nothing;

insert into public.house_rules (couple_id, rule_number)
select 'remus-nicole', rule_number from generate_series(1, 10) as rule_number
on conflict (couple_id, rule_number) do nothing;

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
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'house_rules'
  ) then
    alter publication supabase_realtime add table public.house_rules;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'house_rule_proposals'
  ) then
    alter publication supabase_realtime add table public.house_rule_proposals;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'crime_records'
  ) then
    alter publication supabase_realtime add table public.crime_records;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'crime_record_proposals'
  ) then
    alter publication supabase_realtime add table public.crime_record_proposals;
  end if;
end $$;
