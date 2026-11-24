-- =============================================================================
-- Migration 006: Phase 1 — Public Website, Tenure Privacy Fix & Event Core
-- Project: E-Cell AITR
-- Apply after: 005_hardening_rls_and_rpcs.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. RESOLVE TENURE_HISTORY PUBLIC PRIVACY EXPOSURE & ADD DISPLAY ORDER
-- -------------------------------------------------------------------------

alter table public.profiles
  add column if not exists display_order integer not null default 0;

-- Drop direct anon SELECT on tenure_history (exposed user_id of non-public users)
drop policy if exists "tenure_public_read" on public.tenure_history;

-- Update get_public_team_profiles to respect display_order
drop function if exists public.get_public_team_profiles();
create or replace function public.get_public_team_profiles()
returns table (
  id             uuid,
  full_name      text,
  bio            text,
  designation    text,
  linkedin_url   text,
  avatar_ref     text,
  role           public.app_role,
  effective_from date,
  display_order  integer
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
    m.effective_from,
    p.display_order
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
    p.display_order asc,
    p.full_name asc;
$$;

revoke all on function public.get_public_team_profiles() from public;
grant execute on function public.get_public_team_profiles() to anon, authenticated;

-- Narrow SECURITY DEFINER function for Past Teams (never exposes user_id or private fields)
create or replace function public.get_public_past_teams()
returns table (
  full_name       text,
  designation     text,
  linkedin_url    text,
  avatar_ref      text,
  role            public.app_role,
  effective_from  date,
  effective_until date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    p.designation,
    p.linkedin_url,
    p.avatar_ref,
    t.role,
    t.effective_from,
    t.effective_until
  from public.tenure_history t
  join public.profiles p
    on p.id = t.user_id
  where p.is_public = true
    and t.status in ('approved', 'departed')
    and t.role in ('director', 'advisor', 'core_team')
  order by
    coalesce(t.effective_until, current_date) desc,
    case t.role
      when 'director'  then 1
      when 'advisor'   then 2
      when 'core_team' then 3
      else 4
    end,
    p.full_name asc;
$$;

revoke all on function public.get_public_past_teams() from public;
grant execute on function public.get_public_past_teams() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 2. EVENT ENUMS & TABLES
-- -------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum (
      'draft',
      'published',
      'ongoing',
      'wrap_up',
      'closed',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_audience') then
    create type public.event_audience as enum (
      'public',
      'community_only'
    );
  end if;
end $$;

create table if not exists public.events (
  id                     uuid                  primary key default gen_random_uuid(),
  slug                   text                  not null unique,
  title                  text                  not null,
  summary                text,
  description            text                  not null default '',
  venue                  text,
  starts_at              timestamptz,
  ends_at                timestamptz,
  registration_opens_at  timestamptz,
  registration_closes_at timestamptz,
  status                 public.event_status   not null default 'draft',
  audience               public.event_audience not null default 'public',
  is_paid                boolean               not null default false,
  fee_amount             numeric(10, 2),
  upi_id                 text,
  upi_qr_ref             text,
  poster_ref             text,
  max_capacity           integer,
  created_by             uuid                  not null references public.profiles(id),
  created_at             timestamptz           not null default now(),
  updated_at             timestamptz           not null default now(),

  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_capacity_positive check (max_capacity is null or max_capacity > 0),
  constraint events_fee_valid check (
    (is_paid = false and fee_amount is null)
    or (is_paid = true and fee_amount is not null and fee_amount > 0)
  )
);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

create table if not exists public.event_spocs (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references public.events(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  is_primary  boolean     not null default false,
  assigned_by uuid        references public.profiles(id),
  created_at  timestamptz not null default now(),

  constraint event_spocs_unique unique (event_id, user_id)
);

create table if not exists public.event_guests (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events(id) on delete cascade,
  full_name       text        not null,
  title           text,
  bio             text,
  linkedin_url    text,
  photo_ref       text,
  private_contact text,       -- Never returned in public queries
  display_order   integer     not null default 0,
  created_at      timestamptz not null default now(),

  constraint event_guests_linkedin_format check (
    linkedin_url is null or linkedin_url ~* '^https?://'
  )
);

create table if not exists public.contact_inquiries (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  subject    text        not null,
  message    text        not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 3. EVENT PERMISSION HELPERS & PUBLIC GUESTS / SPOC CANDIDATE RPCS
-- -------------------------------------------------------------------------

create or replace function public.is_event_spoc(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_spocs s
    where s.event_id = p_event_id
      and s.user_id = p_user_id
  )
  and public.is_core_team_or_above(p_user_id);
$$;

create or replace function public.can_manage_event(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_advisor_or_above(p_user_id)
      or public.is_event_spoc(p_event_id, p_user_id);
$$;

-- Public guest list: omits private_contact
create or replace function public.get_public_event_guests(p_event_id uuid)
returns table (
  id            uuid,
  full_name     text,
  title         text,
  bio           text,
  linkedin_url  text,
  photo_ref     text,
  display_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.full_name,
    g.title,
    g.bio,
    g.linkedin_url,
    g.photo_ref,
    g.display_order
  from public.event_guests g
  join public.events e on e.id = g.event_id
  where g.event_id = p_event_id
    and e.audience = 'public'
    and e.status in ('published', 'ongoing', 'wrap_up', 'closed', 'archived')
  order by g.display_order asc, g.full_name asc;
$$;

revoke all on function public.get_public_event_guests(uuid) from public;
grant execute on function public.get_public_event_guests(uuid) to anon, authenticated;

-- Searchable list of approved organization members for SPOC selection
create or replace function public.get_approved_spoc_candidates()
returns table (
  id          uuid,
  full_name   text,
  designation text,
  role        public.app_role
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.designation,
    m.role
  from public.profiles p
  join public.org_memberships m on m.user_id = p.id
  where public.is_core_team_or_above(auth.uid())
    and m.status = 'approved'
    and m.role in ('director', 'advisor', 'core_team')
    and (m.effective_until is null or m.effective_until > current_date)
  order by p.full_name asc;
$$;

revoke all on function public.get_approved_spoc_candidates() from public, anon;
grant execute on function public.get_approved_spoc_candidates() to authenticated;

-- Atomic event creation + SPOC assignment
create or replace function public.create_event_with_spoc(
  p_slug         text,
  p_title        text,
  p_summary      text,
  p_description  text,
  p_venue        text,
  p_starts_at    timestamptz,
  p_ends_at      timestamptz,
  p_status       public.event_status,
  p_is_paid      boolean,
  p_fee_amount   numeric,
  p_upi_id       text,
  p_upi_qr_ref   text,
  p_poster_ref   text,
  p_max_capacity integer,
  p_spoc_ids     uuid[],
  p_creator_id   uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_spoc_id  uuid;
  v_idx      int := 0;
begin
  if not public.is_core_team_or_above(p_creator_id) then
    raise exception 'Only approved Core Team, Advisors, or the Director can create events.';
  end if;

  if p_spoc_ids is null or array_length(p_spoc_ids, 1) is null then
    raise exception 'At least one approved Event Lead (SPOC) must be assigned.';
  end if;

  insert into public.events (
    slug, title, summary, description, venue, starts_at, ends_at,
    status, audience, is_paid, fee_amount, upi_id, upi_qr_ref, poster_ref,
    max_capacity, created_by
  )
  values (
    trim(p_slug), trim(p_title), nullif(trim(p_summary), ''), coalesce(p_description, ''),
    nullif(trim(p_venue), ''), p_starts_at, p_ends_at,
    coalesce(p_status, 'draft'), 'public', coalesce(p_is_paid, false),
    case when coalesce(p_is_paid, false) then p_fee_amount else null end,
    case when coalesce(p_is_paid, false) then nullif(trim(p_upi_id), '') else null end,
    case when coalesce(p_is_paid, false) then nullif(trim(p_upi_qr_ref), '') else null end,
    nullif(trim(p_poster_ref), ''), p_max_capacity, p_creator_id
  )
  returning id into v_event_id;

  foreach v_spoc_id in array p_spoc_ids loop
    if not public.is_core_team_or_above(v_spoc_id) then
      raise exception 'All SPOCs must be approved Core Team, Advisors, or Director.';
    end if;
    v_idx := v_idx + 1;
    insert into public.event_spocs (event_id, user_id, is_primary, assigned_by)
    values (v_event_id, v_spoc_id, v_idx = 1, p_creator_id)
    on conflict (event_id, user_id) do nothing;
  end loop;

  return v_event_id;
end;
$$;

revoke all on function public.create_event_with_spoc(text, text, text, text, text, timestamptz, timestamptz, public.event_status, boolean, numeric, text, text, text, integer, uuid[], uuid) from public, anon, authenticated;
grant execute on function public.create_event_with_spoc(text, text, text, text, text, timestamptz, timestamptz, public.event_status, boolean, numeric, text, text, text, integer, uuid[], uuid) to service_role;

-- -------------------------------------------------------------------------
-- 4. RLS POLICIES FOR PHASE 1 TABLES
-- -------------------------------------------------------------------------

alter table public.events            enable row level security;
alter table public.event_spocs       enable row level security;
alter table public.event_guests      enable row level security;
alter table public.contact_inquiries enable row level security;

-- EVENTS
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
  on public.events for select
  using (
    audience = 'public'
    and status in ('published', 'ongoing', 'wrap_up', 'closed', 'archived')
  );

drop policy if exists "events_workspace_read" on public.events;
create policy "events_workspace_read"
  on public.events for select
  to authenticated
  using (public.can_manage_event(id, auth.uid()) or created_by = auth.uid());

drop policy if exists "events_core_insert" on public.events;
create policy "events_core_insert"
  on public.events for insert
  to authenticated
  with check (
    public.is_core_team_or_above(auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "events_manage_update" on public.events;
create policy "events_manage_update"
  on public.events for update
  to authenticated
  using (public.can_manage_event(id, auth.uid()))
  with check (public.can_manage_event(id, auth.uid()));

-- EVENT_SPOCS
drop policy if exists "event_spocs_core_read" on public.event_spocs;
create policy "event_spocs_core_read"
  on public.event_spocs for select
  to authenticated
  using (public.is_core_team_or_above(auth.uid()));

drop policy if exists "event_spocs_manage_write" on public.event_spocs;
create policy "event_spocs_manage_write"
  on public.event_spocs for all
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()))
  with check (
    public.can_manage_event(event_id, auth.uid())
    and public.is_core_team_or_above(user_id)
  );

-- EVENT_GUESTS (public reads go through get_public_event_guests() only!)
drop policy if exists "event_guests_manage_all" on public.event_guests;
create policy "event_guests_manage_all"
  on public.event_guests for all
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()))
  with check (public.can_manage_event(event_id, auth.uid()));

-- CONTACT_INQUIRIES
drop policy if exists "contact_public_insert" on public.contact_inquiries;
create policy "contact_public_insert"
  on public.contact_inquiries for insert
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 3
    and length(trim(subject)) > 0
    and length(trim(message)) > 0
  );

drop policy if exists "contact_advisor_read" on public.contact_inquiries;
create policy "contact_advisor_read"
  on public.contact_inquiries for select
  to authenticated
  using (public.is_advisor_or_above(auth.uid()));

-- -------------------------------------------------------------------------
-- 5. INDEXES
-- -------------------------------------------------------------------------

create index if not exists idx_events_status_audience on public.events (status, audience, starts_at desc);
create index if not exists idx_event_spocs_user on public.event_spocs (user_id);
create index if not exists idx_event_guests_event on public.event_guests (event_id, display_order);
create index if not exists idx_contact_inquiries_created on public.contact_inquiries (created_at desc);
