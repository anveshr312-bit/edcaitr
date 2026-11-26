-- =============================================================================
-- Migration 015: Allow users to create their own initial profile & backfill
-- Fixes foreign key constraint violations on public.applications (23503)
-- =============================================================================

-- 1. Allow authenticated users to insert their own profile if missing
drop policy if exists "profiles_own_insert" on public.profiles;

create policy "profiles_own_insert"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- 2. Backfill any auth.users that are missing a row in public.profiles
insert into public.profiles (id, full_name)
select 
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'User')
from auth.users u
where u.id not in (select id from public.profiles)
on conflict (id) do nothing;
