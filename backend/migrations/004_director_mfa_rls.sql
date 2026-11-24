-- =============================================================================
-- Migration 004: Enforce Director authenticator MFA (aal2) at DB RLS boundary
-- Project: E-Cell AITR
-- Apply after: 002_rls_policies.sql
-- =============================================================================

-- Helper: true only when the current Director session has verified TOTP (aal2)
create or replace function public.is_director_with_mfa(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_director(user_uuid)
    and coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

-- Tighten Director policies to require MFA (aal2) for privileged DB operations

drop policy if exists "profiles_director_update_any" on public.profiles;
create policy "profiles_director_update_any"
  on public.profiles for update
  to authenticated
  using  (public.is_director_with_mfa(auth.uid()))
  with check (public.is_director_with_mfa(auth.uid()));

drop policy if exists "memberships_director_write" on public.org_memberships;
create policy "memberships_director_write"
  on public.org_memberships for all
  to authenticated
  using  (public.is_director_with_mfa(auth.uid()))
  with check (public.is_director_with_mfa(auth.uid()));

drop policy if exists "applications_director_review" on public.applications;
create policy "applications_director_review"
  on public.applications for update
  to authenticated
  using (
    public.is_director_with_mfa(auth.uid())
    and applicant_id <> auth.uid()
  )
  with check (
    reviewed_by = auth.uid()
    and status in ('approved', 'rejected')
  );

drop policy if exists "audit_director_read" on public.audit_log;
create policy "audit_director_read"
  on public.audit_log for select
  to authenticated
  using (public.is_director_with_mfa(auth.uid()));
