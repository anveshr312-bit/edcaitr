-- =============================================================================
-- Migration 001: Core profiles and role hierarchy
-- Project: E-Cell AITR
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. ENUMS
-- -------------------------------------------------------------------------

-- Administrative / membership roles.
-- 'participant' is the baseline role every authenticated user has.
-- Administrative roles are stored separately in org_memberships.
create type public.app_role as enum (
  'participant',   -- default for all authenticated users
  'core_team',
  'advisor',
  'director',
  'alumni'         -- former member, Alumni Connect eligible
);

-- Lifecycle status for all administrative membership requests and applications.
create type public.membership_status as enum (
  'pending',    -- application submitted, awaiting review
  'approved',   -- active membership
  'rejected',   -- application denied
  'suspended',  -- access suspended by Director/Advisor
  'departed'    -- voluntarily or formally exited; historical record preserved
);

-- Application types that progress through the approval workflow.
create type public.application_type as enum (
  'advisor_application',   -- anyone applying to become Advisor
  'core_team_application', -- anyone applying to become Core Team
  'alumni_verification',   -- former member applying for alumni status
  'promotion_nomination'   -- Advisor nominating Core Team for promotion to Advisor
);

-- Audit event types — append-only log.
create type public.audit_event as enum (
  'profile_updated',
  'application_submitted',
  'application_reviewed',
  'role_granted',
  'role_revoked',
  'membership_suspended',
  'membership_departed',
  'promotion_nominated',
  'promotion_approved',
  'promotion_rejected',
  'mfa_enforcement_checked',
  'director_action',
  'rls_policy_violation_attempt'
);

-- -------------------------------------------------------------------------
-- 2. PROFILES  (one row per auth.users entry)
-- -------------------------------------------------------------------------

create table public.profiles (
  id                uuid        primary key references auth.users (id) on delete cascade,
  full_name         text        not null default '',
  phone             text,
  bio               text,
  designation       text,       -- e.g. "Frontend Lead", "Event Head"
  linkedin_url      text,
  avatar_ref        text,       -- ImageKit path/reference — no raw URLs exposed
  college           text,
  enrollment_no     text,
  is_public         boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Soft constraint: linkedin_url must look like a URL if provided
  constraint profiles_linkedin_url_format check (
    linkedin_url is null or linkedin_url ~* '^https?://'
  )
);

comment on table public.profiles is
  'One profile per auth user. Participant-level by default. Admin roles live in org_memberships.';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 3. ORG_MEMBERSHIPS  (administrative / alumni membership records)
-- -------------------------------------------------------------------------

create table public.org_memberships (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles (id) on delete cascade,
  role            public.app_role not null,
  status          public.membership_status not null default 'pending',

  -- Who approved/rejected this membership
  reviewed_by     uuid            references public.profiles (id),
  reviewed_at     timestamptz,
  review_note     text,

  -- Tenure window
  effective_from  date,
  effective_until date,           -- null = currently active

  -- Optional scheduling of departure/handover
  handover_date   date,
  handover_note   text,

  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now(),

  -- A user may hold at most one active record per role
  constraint org_memberships_unique_active_role unique nulls not distinct (user_id, role, effective_until),

  -- Director cannot self-approve
  constraint org_memberships_no_self_review check (user_id <> reviewed_by),

  -- Only administrative/alumni roles go in this table
  constraint org_memberships_admin_roles_only check (
    role in ('core_team', 'advisor', 'director', 'alumni')
  )
);

comment on table public.org_memberships is
  'Administrative and alumni memberships. Participant baseline is implicit from auth.users presence.';

create trigger org_memberships_updated_at
  before update on public.org_memberships
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 4. APPLICATIONS  (approval workflow requests)
-- -------------------------------------------------------------------------

create table public.applications (
  id                uuid                      primary key default gen_random_uuid(),
  applicant_id      uuid                      not null references public.profiles (id) on delete cascade,
  application_type  public.application_type   not null,
  status            public.membership_status  not null default 'pending',

  -- Free-text motivation / supporting statement
  statement         text,

  -- Who reviewed and when
  reviewed_by       uuid                      references public.profiles (id),
  reviewed_at       timestamptz,
  review_note       text,

  -- For promotion nominations: who was nominated
  nominee_id        uuid                      references public.profiles (id),

  created_at        timestamptz               not null default now(),
  updated_at        timestamptz               not null default now(),

  -- Prevent self-review
  constraint applications_no_self_review check (applicant_id <> reviewed_by),
  -- A user cannot have two pending applications of the same type
  constraint applications_one_pending_per_type unique nulls not distinct (applicant_id, application_type, reviewed_at)
);

comment on table public.applications is
  'Tracks all role applications and promotion nominations through the approval workflow.';

create trigger applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 5. TENURE_HISTORY  (immutable record of past memberships)
-- -------------------------------------------------------------------------

create table public.tenure_history (
  id              uuid            primary key default gen_random_uuid(),
  user_id         uuid            not null references public.profiles (id) on delete cascade,
  role            public.app_role not null,
  status          public.membership_status not null,
  effective_from  date,
  effective_until date,
  created_at      timestamptz     not null default now()
  -- Intentionally no updated_at: this table is append-only
);

comment on table public.tenure_history is
  'Append-only history of all org memberships. Never updated, only inserted.';

-- Trigger: archive to tenure_history when a membership departs/is revoked
create or replace function public.archive_membership_to_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('departed', 'rejected', 'suspended') and old.status = 'approved' then
    insert into public.tenure_history (user_id, role, status, effective_from, effective_until)
    values (old.user_id, old.role, new.status, old.effective_from, coalesce(new.effective_until, current_date));
  end if;
  return new;
end;
$$;

create trigger archive_on_membership_change
  after update on public.org_memberships
  for each row execute procedure public.archive_membership_to_history();

-- -------------------------------------------------------------------------
-- 6. AUDIT_LOG  (append-only, never updated)
-- -------------------------------------------------------------------------

create table public.audit_log (
  id            uuid                  primary key default gen_random_uuid(),
  actor_id      uuid                  references public.profiles (id),
  event         public.audit_event    not null,
  target_id     uuid,                 -- user/application/membership affected
  target_type   text,                 -- 'profile' | 'application' | 'org_membership' | ...
  detail        jsonb,                -- structured extra context; never includes passwords or keys
  ip_address    inet,
  created_at    timestamptz           not null default now()
  -- No updated_at: append-only
);

comment on table public.audit_log is
  'Immutable audit trail for all sensitive administrative actions.';

-- -------------------------------------------------------------------------
-- 7. HELPER: role resolution function (called from RLS policies)
-- -------------------------------------------------------------------------

-- Returns the highest active administrative role of a user, or 'participant'.
-- Called as: public.get_user_role(auth.uid())
create or replace function public.get_user_role(user_uuid uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.org_memberships
      where user_id = user_uuid
        and status = 'approved'
        and (effective_until is null or effective_until > current_date)
      order by
        case role
          when 'director'  then 1
          when 'advisor'   then 2
          when 'core_team' then 3
          when 'alumni'    then 4
          else 5
        end
      limit 1
    ),
    'participant'::public.app_role
  );
$$;

-- Boolean convenience helpers used in RLS policies
create or replace function public.is_director(user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_user_role(user_uuid) = 'director';
$$;

create or replace function public.is_advisor_or_above(user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_user_role(user_uuid) in ('director', 'advisor');
$$;

create or replace function public.is_core_team_or_above(user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_user_role(user_uuid) in ('director', 'advisor', 'core_team');
$$;

create or replace function public.is_alumni_connect_eligible(user_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_user_role(user_uuid) in ('director', 'advisor', 'core_team', 'alumni');
$$;

-- -------------------------------------------------------------------------
-- 8. INDEXES
-- -------------------------------------------------------------------------

create index on public.profiles (is_public);
create index on public.org_memberships (user_id, status);
create index on public.org_memberships (role, status);
create index on public.applications (applicant_id, status);
create index on public.applications (application_type, status);
create index on public.tenure_history (user_id);
create index on public.audit_log (actor_id, created_at desc);
create index on public.audit_log (target_id, created_at desc);
