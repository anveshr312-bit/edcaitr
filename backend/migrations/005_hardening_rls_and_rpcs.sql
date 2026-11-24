-- =============================================================================
-- Migration 005: Security hardening (profiles exposure, MFA RLS, atomic RPCs)
-- Project: E-Cell AITR
-- Apply after: 004_director_mfa_rls.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. PUBLIC PROFILE EXPOSURE HARDENING
--    - Remove direct anon/public SELECT on public.profiles (which exposed
--      private columns like phone and enrollment_no).
--    - Provide a narrow SECURITY DEFINER view/function exposing ONLY public
--      fields for approved, publicly visible organization members.
-- -------------------------------------------------------------------------

drop policy if exists "profiles_public_read" on public.profiles;

create or replace function public.get_public_team_profiles()
returns table (
  id           uuid,
  full_name    text,
  bio          text,
  designation  text,
  linkedin_url text,
  avatar_ref   text,
  role         public.app_role,
  effective_from date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.bio,
    p.designation,
    p.linkedin_url,
    p.avatar_ref,
    m.role,
    m.effective_from
  from public.profiles p
  join public.org_memberships m
    on m.user_id = p.id
  where p.is_public = true
    and m.status = 'approved'
    and m.role in ('director', 'advisor', 'core_team')
    and (m.effective_until is null or m.effective_until > current_date)
  order by
    case m.role
      when 'director'  then 1
      when 'advisor'   then 2
      when 'core_team' then 3
      else 4
    end,
    p.full_name asc;
$$;

revoke all on function public.get_public_team_profiles() from public;
grant execute on function public.get_public_team_profiles() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 2. PREVENT UNAUTHORIZED MODIFICATION OF PRIVILEGED PROFILE FIELDS
--    - Regular users cannot self-modify `designation` or `is_public`.
--    - Only Advisors (or Director with MFA) or service_role may modify them.
-- -------------------------------------------------------------------------

create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
begin
  -- Service-role / SQL Editor (auth.uid() is null) is allowed
  if v_uid is null then
    return new;
  end if;

  if new.designation is distinct from old.designation
     or new.is_public is distinct from old.is_public then
    v_role := public.get_user_role(v_uid);
    if v_role = 'advisor' then
      return new;
    elsif v_role = 'director' and public.is_director_with_mfa(v_uid) then
      return new;
    else
      raise exception 'Only Advisors or MFA-verified Director may modify designation or public visibility.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_fields on public.profiles;
create trigger profiles_guard_privileged_fields
  before update on public.profiles
  for each row execute procedure public.guard_profile_privileged_fields();

-- -------------------------------------------------------------------------
-- 3. REMOVE OVERLAPPING PERMISSIVE POLICIES THAT BYPASS DIRECTOR MFA
--    - Director without aal2 MFA must NOT fall through to Advisor policies
--      on applications_advisor_review or audit_advisor_read.
-- -------------------------------------------------------------------------

drop policy if exists "applications_advisor_review" on public.applications;
create policy "applications_advisor_review"
  on public.applications for update
  to authenticated
  using (
    public.get_user_role(auth.uid()) = 'advisor'
    and application_type in ('core_team_application', 'alumni_verification')
    and applicant_id <> auth.uid()
    and reviewed_by is null
  )
  with check (
    reviewed_by = auth.uid()
    and status in ('approved', 'rejected')
  );

drop policy if exists "audit_advisor_read" on public.audit_log;
create policy "audit_advisor_read"
  on public.audit_log for select
  to authenticated
  using (
    public.get_user_role(auth.uid()) = 'advisor'
    and event <> 'director_action'
  );

-- -------------------------------------------------------------------------
-- 4. ATOMIC RPC FUNCTIONS FOR SECURITY-SENSITIVE WORKFLOWS
--    - Executed inside a single PostgreSQL transaction with row-level locks
--      (SELECT ... FOR UPDATE) to prevent concurrent duplicate approvals.
--    - Restricted to service_role only (called from verified server routes).
-- -------------------------------------------------------------------------

create or replace function public.process_application_review(
  p_application_id uuid,
  p_reviewer_id    uuid,
  p_decision       public.membership_status,
  p_note           text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app          record;
  v_reviewer_role public.app_role;
  v_granted_role  public.app_role;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: must be approved or rejected.';
  end if;

  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'Review note is required.';
  end if;

  v_reviewer_role := public.get_user_role(p_reviewer_id);
  if v_reviewer_role not in ('advisor', 'director') then
    raise exception 'Reviewer does not hold Advisor or Director role.';
  end if;

  -- Lock application row to serialize concurrent review attempts
  select id, applicant_id, application_type, status, reviewed_at
  into v_app
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  if v_app.applicant_id = p_reviewer_id then
    raise exception 'You cannot review your own application.';
  end if;

  if v_app.reviewed_at is not null or v_app.status <> 'pending' then
    raise exception 'This application has already been reviewed.';
  end if;

  if v_app.application_type = 'promotion_nomination' then
    raise exception 'Use process_promotion_approval for promotion nominations.';
  end if;

  if v_app.application_type = 'advisor_application' and v_reviewer_role <> 'director' then
    raise exception 'Only the Director can review Advisor applications.';
  end if;

  update public.applications
  set
    status      = p_decision,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_note = trim(p_note)
  where id = p_application_id;

  insert into public.audit_log (actor_id, event, target_id, target_type, detail)
  values (
    p_reviewer_id,
    'application_reviewed',
    p_application_id,
    'application',
    jsonb_build_object(
      'applicant_id', v_app.applicant_id,
      'application_type', v_app.application_type,
      'decision', p_decision
    )
  );

  if p_decision = 'approved' then
    v_granted_role := case v_app.application_type
      when 'core_team_application' then 'core_team'::public.app_role
      when 'alumni_verification'   then 'alumni'::public.app_role
      when 'advisor_application'   then 'advisor'::public.app_role
    end;

    -- Prevent duplicate active membership for the same role
    if exists (
      select 1 from public.org_memberships
      where user_id = v_app.applicant_id
        and role = v_granted_role
        and status = 'approved'
        and effective_until is null
    ) then
      raise exception 'User already holds an active % membership.', v_granted_role;
    end if;

    insert into public.org_memberships (
      user_id, role, status, reviewed_by, reviewed_at, effective_from, review_note
    )
    values (
      v_app.applicant_id,
      v_granted_role,
      'approved',
      p_reviewer_id,
      now(),
      current_date,
      trim(p_note)
    );

    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (
      p_reviewer_id,
      'role_granted',
      v_app.applicant_id,
      'org_membership',
      jsonb_build_object('role', v_granted_role, 'application_id', p_application_id)
    );
  end if;

  return jsonb_build_object('ok', true, 'decision', p_decision);
end;
$$;

revoke all on function public.process_application_review(uuid, uuid, public.membership_status, text) from public, anon, authenticated;
grant execute on function public.process_application_review(uuid, uuid, public.membership_status, text) to service_role;

-- -------------------------------------------------------------------------

create or replace function public.process_promotion_approval(
  p_application_id uuid,
  p_director_id    uuid,
  p_decision       public.membership_status,
  p_note           text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app record;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: must be approved or rejected.';
  end if;

  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'Review note is required.';
  end if;

  if public.get_user_role(p_director_id) <> 'director' then
    raise exception 'Only the Director can approve promotions.';
  end if;

  select id, applicant_id, nominee_id, application_type, status, reviewed_at
  into v_app
  from public.applications
  where id = p_application_id
    and application_type = 'promotion_nomination'
  for update;

  if not found then
    raise exception 'Promotion nomination not found.';
  end if;

  if v_app.reviewed_at is not null or v_app.status <> 'pending' then
    raise exception 'This nomination has already been reviewed.';
  end if;

  if v_app.nominee_id is null then
    raise exception 'Nominee ID is missing.';
  end if;

  if v_app.nominee_id = p_director_id then
    raise exception 'Director cannot self-promote.';
  end if;

  update public.applications
  set
    status      = p_decision,
    reviewed_by = p_director_id,
    reviewed_at = now(),
    review_note = trim(p_note)
  where id = p_application_id;

  if p_decision = 'approved' then
    update public.org_memberships
    set
      status          = 'departed',
      effective_until = current_date
    where user_id = v_app.nominee_id
      and role = 'core_team'
      and status = 'approved'
      and effective_until is null;

    if exists (
      select 1 from public.org_memberships
      where user_id = v_app.nominee_id
        and role = 'advisor'
        and status = 'approved'
        and effective_until is null
    ) then
      raise exception 'Nominee already holds an active Advisor membership.';
    end if;

    insert into public.org_memberships (
      user_id, role, status, reviewed_by, reviewed_at, effective_from, review_note
    )
    values (
      v_app.nominee_id,
      'advisor',
      'approved',
      p_director_id,
      now(),
      current_date,
      trim(p_note)
    );

    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (
      p_director_id,
      'promotion_approved',
      v_app.nominee_id,
      'org_membership',
      jsonb_build_object(
        'from_role', 'core_team',
        'to_role', 'advisor',
        'nominated_by', v_app.applicant_id,
        'application_id', p_application_id
      )
    );
  else
    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (
      p_director_id,
      'promotion_rejected',
      v_app.nominee_id,
      'application',
      jsonb_build_object('application_id', p_application_id, 'reason', trim(p_note))
    );
  end if;

  return jsonb_build_object('ok', true, 'decision', p_decision);
end;
$$;

revoke all on function public.process_promotion_approval(uuid, uuid, public.membership_status, text) from public, anon, authenticated;
grant execute on function public.process_promotion_approval(uuid, uuid, public.membership_status, text) to service_role;

-- -------------------------------------------------------------------------

create or replace function public.process_membership_revocation(
  p_target_user_id uuid,
  p_director_id    uuid,
  p_new_status     public.membership_status,
  p_reason         text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected int;
begin
  if p_new_status not in ('suspended', 'departed') then
    raise exception 'Invalid revocation status.';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Reason is required.';
  end if;

  if p_target_user_id = p_director_id then
    raise exception 'The Director cannot revoke their own membership this way.';
  end if;

  if public.get_user_role(p_director_id) <> 'director' then
    raise exception 'Only the Director can revoke memberships.';
  end if;

  update public.org_memberships
  set
    status          = p_new_status,
    effective_until = current_date,
    handover_note   = trim(p_reason)
  where user_id = p_target_user_id
    and status = 'approved'
    and effective_until is null;

  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    raise exception 'No active membership found for this user.';
  end if;

  insert into public.audit_log (actor_id, event, target_id, target_type, detail)
  values (
    p_director_id,
    case when p_new_status = 'suspended'
      then 'membership_suspended'::public.audit_event
      else 'membership_departed'::public.audit_event
    end,
    p_target_user_id,
    'org_membership',
    jsonb_build_object('reason', trim(p_reason), 'affected_records', v_affected)
  );

  return jsonb_build_object('ok', true, 'affected', v_affected);
end;
$$;

revoke all on function public.process_membership_revocation(uuid, uuid, public.membership_status, text) from public, anon, authenticated;
grant execute on function public.process_membership_revocation(uuid, uuid, public.membership_status, text) to service_role;
