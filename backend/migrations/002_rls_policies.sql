-- =============================================================================
-- Migration 002: Row Level Security policies
-- Project: E-Cell AITR
-- Apply after: 001_profiles_and_roles.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- Enable RLS on all user-facing tables
-- -------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.org_memberships enable row level security;
alter table public.applications    enable row level security;
alter table public.tenure_history  enable row level security;
alter table public.audit_log       enable row level security;

-- =========================================================================
-- PROFILES
-- =========================================================================

-- Public: anyone (even anon) can see profiles marked is_public = true
create policy "profiles_public_read"
  on public.profiles for select
  using (is_public = true);

-- Authenticated: each user reads their own profile always
create policy "profiles_own_read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Advisors and above can read all profiles (for assignment pickers, etc.)
create policy "profiles_advisor_read_all"
  on public.profiles for select
  to authenticated
  using (public.is_advisor_or_above(auth.uid()));

-- Users update only their own profile
create policy "profiles_own_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Director can update any profile (for visibility, ordering, designation)
create policy "profiles_director_update_any"
  on public.profiles for update
  to authenticated
  using  (public.is_director(auth.uid()))
  with check (public.is_director(auth.uid()));

-- Profiles are created by the trigger; no direct insert from client
-- (service role used by trigger bypasses RLS)

-- =========================================================================
-- ORG_MEMBERSHIPS
-- =========================================================================

-- Users can see their own memberships
create policy "memberships_own_read"
  on public.org_memberships for select
  to authenticated
  using (user_id = auth.uid());

-- Core Team and above can read all memberships (for team lists, selectors)
create policy "memberships_core_team_read"
  on public.org_memberships for select
  to authenticated
  using (public.is_core_team_or_above(auth.uid()));

-- Only Director can insert/update/delete org_memberships
-- (Application approval goes through server-side functions, not direct client writes)
create policy "memberships_director_write"
  on public.org_memberships for all
  to authenticated
  using  (public.is_director(auth.uid()))
  with check (public.is_director(auth.uid()));

-- =========================================================================
-- APPLICATIONS
-- =========================================================================

-- Applicants see their own applications
create policy "applications_own_read"
  on public.applications for select
  to authenticated
  using (applicant_id = auth.uid());

-- Advisors see all Core Team applications; Director sees everything
create policy "applications_advisor_read"
  on public.applications for select
  to authenticated
  using (
    public.is_director(auth.uid())
    or (
      public.is_advisor_or_above(auth.uid())
      and application_type in ('core_team_application', 'alumni_verification')
    )
  );

-- Director sees advisor applications and promotion nominations
create policy "applications_director_read_all"
  on public.applications for select
  to authenticated
  using (public.is_director(auth.uid()));

-- Any authenticated user can submit an application for themselves
create policy "applications_self_insert"
  on public.applications for insert
  to authenticated
  with check (
    applicant_id = auth.uid()
    and reviewed_by is null       -- cannot pre-set reviewer
    and reviewed_at is null
    and status = 'pending'        -- must start as pending
    and nominee_id is null        -- self-applications cannot name a nominee
  );

-- Advisors can review (update) Core Team applications — but not approve themselves
create policy "applications_advisor_review"
  on public.applications for update
  to authenticated
  using (
    public.is_advisor_or_above(auth.uid())
    and application_type in ('core_team_application', 'alumni_verification')
    and applicant_id <> auth.uid()   -- no self-approval
    and reviewed_by is null          -- not already reviewed
  )
  with check (
    reviewed_by = auth.uid()
    and status in ('approved', 'rejected')
  );

-- Director reviews advisor applications and promotion nominations
create policy "applications_director_review"
  on public.applications for update
  to authenticated
  using (
    public.is_director(auth.uid())
    and applicant_id <> auth.uid()   -- Director cannot self-approve
  )
  with check (
    reviewed_by = auth.uid()
    and status in ('approved', 'rejected')
  );

-- Advisor can submit promotion nominations (for core_team → advisor)
create policy "applications_advisor_nominate"
  on public.applications for insert
  to authenticated
  with check (
    public.is_advisor_or_above(auth.uid())
    and application_type = 'promotion_nomination'
    and applicant_id = auth.uid()     -- the nominator is the applicant
    and nominee_id is not null        -- must name a nominee
    and nominee_id <> auth.uid()      -- cannot nominate self
    and status = 'pending'
  );

-- =========================================================================
-- TENURE_HISTORY
-- =========================================================================

-- Users view their own tenure history
create policy "tenure_own_read"
  on public.tenure_history for select
  to authenticated
  using (user_id = auth.uid());

-- Advisors and above can view all tenure history
create policy "tenure_admin_read"
  on public.tenure_history for select
  to authenticated
  using (public.is_advisor_or_above(auth.uid()));

-- Public can view approved/departed history for public Team / Past Teams pages
create policy "tenure_public_read"
  on public.tenure_history for select
  using (status in ('approved', 'departed'));

-- No direct inserts/updates from clients; handled by trigger only

-- =========================================================================
-- AUDIT_LOG
-- =========================================================================

-- Director reads all audit log entries
create policy "audit_director_read"
  on public.audit_log for select
  to authenticated
  using (public.is_director(auth.uid()));

-- Advisors read non-Director audit entries
create policy "audit_advisor_read"
  on public.audit_log for select
  to authenticated
  using (
    public.is_advisor_or_above(auth.uid())
    and event <> 'director_action'
  );

-- No direct client inserts into audit_log; server functions only
