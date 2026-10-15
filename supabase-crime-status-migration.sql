-- NR Wish List: crime record status and punishment migration
-- Run this once in the Supabase SQL Editor.

alter table public.crime_records
  add column if not exists status text default '未處理';
alter table public.crime_records
  add column if not exists punishment text default '';
alter table public.crime_record_proposals
  add column if not exists status text default '未處理';
alter table public.crime_record_proposals
  add column if not exists punishment text default '';
alter table public.crime_record_proposals
  add column if not exists record_id uuid references public.crime_records(id) on delete cascade;
alter table public.crime_records
  add column if not exists rule_text text not null default '';
alter table public.crime_record_proposals
  add column if not exists rule_text text not null default '';

update public.crime_records
set status = '未處理'
where status is null;

update public.crime_records
set punishment = ''
where punishment is null;

update public.crime_record_proposals
set status = '未處理'
where status is null;

update public.crime_record_proposals
set punishment = ''
where punishment is null;

alter table public.crime_records
  alter column status set default '未處理',
  alter column status set not null,
  alter column punishment set default '',
  alter column punishment set not null;
alter table public.crime_record_proposals
  alter column status set default '未處理',
  alter column status set not null,
  alter column punishment set default '',
  alter column punishment set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'crime_records_status_check'
      and conrelid = 'public.crime_records'::regclass
  ) then
    alter table public.crime_records
      add constraint crime_records_status_check
      check (status in ('未處理', '已道歉', '已補償', '已處理'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'crime_record_proposals_status_check'
      and conrelid = 'public.crime_record_proposals'::regclass
  ) then
    alter table public.crime_record_proposals
      add constraint crime_record_proposals_status_check
      check (status in ('未處理', '已道歉', '已補償', '已處理'));
  end if;
end
$$;

alter table public.crime_records enable row level security;

drop policy if exists "shared couple can update crime records" on public.crime_records;
create policy "shared couple can update crime records" on public.crime_records
  for update to anon, authenticated
  using (couple_id = 'remus-nicole')
  with check (couple_id = 'remus-nicole');
