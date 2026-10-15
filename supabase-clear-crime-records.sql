-- NR Wish List: clear crime records only
-- House Rules and House Rule proposals are not touched.
-- Run this once in the Supabase SQL Editor.

begin;

delete from public.crime_record_proposals;
delete from public.crime_records;

commit;
