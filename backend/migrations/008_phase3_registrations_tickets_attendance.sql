-- =============================================================================
-- Migration 008: Phase 3 — Registrations, Payments, QR Tickets & Attendance
-- Project: E-Cell AITR
-- Apply after: 007_phase2_operational_teams_and_tasks.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. ENUMS & EVENT SHEET COLUMN
-- -------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type public.registration_status as enum (
      'pending_payment',
      'confirmed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'not_required',
      'pending_verification',
      'verified',
      'rejected'
    );
  end if;
end $$;

alter table public.events
  add column if not exists google_sheet_id text;

-- -------------------------------------------------------------------------
-- 2. TABLES
-- -------------------------------------------------------------------------

create table if not exists public.registrations (
  id                   uuid                       primary key default gen_random_uuid(),
  event_id             uuid                       not null references public.events(id) on delete cascade,
  user_id              uuid                       not null references public.profiles(id) on delete cascade,
  participant_category text                       not null default 'student',
  organization         text,
  status               public.registration_status not null default 'confirmed',
  payment_status       public.payment_status      not null default 'not_required',
  payment_ref          text,
  payment_proof_ref    text,
  payment_verified_by  uuid                       references public.profiles(id),
  payment_verified_at  timestamptz,
  created_at           timestamptz                not null default now(),
  updated_at           timestamptz                not null default now(),

  constraint registrations_unique_user_event unique (event_id, user_id),
  constraint registrations_category_valid check (
    participant_category in ('student', 'founder', 'startup_rep', 'other')
  )
);

drop trigger if exists registrations_updated_at on public.registrations;
create trigger registrations_updated_at
  before update on public.registrations
  for each row execute procedure public.set_updated_at();

create table if not exists public.tickets (
  id              uuid        primary key default gen_random_uuid(),
  registration_id uuid        not null unique references public.registrations(id) on delete cascade,
  event_id        uuid        not null references public.events(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  ticket_code     text        not null unique,
  qr_token        uuid        not null unique default gen_random_uuid(),
  email_sent_at   timestamptz,
  issued_at       timestamptz not null default now()
);

create table if not exists public.attendance_logs (
  id                uuid        primary key default gen_random_uuid(),
  registration_id   uuid        not null unique references public.registrations(id) on delete cascade,
  event_id          uuid        not null references public.events(id) on delete cascade,
  checked_in_at     timestamptz not null default now(),
  checked_in_by     uuid        not null references public.profiles(id),
  correction_reason text,
  sheets_synced_at  timestamptz
);

create table if not exists public.announcements (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        references public.events(id) on delete cascade,
  title      text        not null,
  body       text        not null,
  created_by uuid        not null references public.profiles(id),
  created_at timestamptz not null default now(),

  constraint announcements_nonempty check (length(trim(title)) > 0 and length(trim(body)) > 0)
);

-- -------------------------------------------------------------------------
-- 3. PERMISSION HELPERS & ATOMIC RPCS
-- -------------------------------------------------------------------------

create or replace function public.is_rd_or_manager(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_event(p_event_id, p_user_id)
      or (
        public.is_core_team_or_above(p_user_id)
        and exists (
          select 1 from public.event_team_members m
          where m.event_id = p_event_id
            and m.user_id = p_user_id
            and m.team_code = 'RD'
        )
      );
$$;

-- Atomic registration with row-level lock on event to prevent capacity race conditions
create or replace function public.register_for_event(
  p_event_id          uuid,
  p_user_id           uuid,
  p_category          text default 'student',
  p_organization      text default null,
  p_payment_ref       text default null,
  p_payment_proof_ref text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event         record;
  v_active_count  int;
  v_reg_id        uuid;
  v_ticket_id     uuid;
  v_ticket_code   text;
  v_qr_token      uuid;
  v_reg_status    public.registration_status;
  v_pay_status    public.payment_status;
begin
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status not in ('published', 'ongoing') then
    raise exception 'Registrations are not open for this event.';
  end if;

  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'Registration has not opened yet.';
  end if;

  if v_event.registration_closes_at is not null and now() > v_event.registration_closes_at then
    raise exception 'Registration window has closed.';
  end if;

  if exists (
    select 1 from public.registrations
    where event_id = p_event_id and user_id = p_user_id and status <> 'cancelled'
  ) then
    raise exception 'You are already registered for this event.';
  end if;

  if v_event.max_capacity is not null then
    select count(*) into v_active_count
    from public.registrations
    where event_id = p_event_id and status in ('confirmed', 'pending_payment');

    if v_active_count >= v_event.max_capacity then
      raise exception 'Event registration capacity is full.';
    end if;
  end if;

  if v_event.is_paid then
    if p_payment_ref is null or length(trim(p_payment_ref)) < 4 then
      raise exception 'Payment reference / UTR is required for paid events.';
    end if;
    v_reg_status := 'pending_payment';
    v_pay_status := 'pending_verification';
  else
    v_reg_status := 'confirmed';
    v_pay_status := 'not_required';
  end if;

  insert into public.registrations (
    event_id, user_id, participant_category, organization,
    status, payment_status, payment_ref, payment_proof_ref
  )
  values (
    p_event_id, p_user_id, coalesce(nullif(trim(p_category), ''), 'student'),
    nullif(trim(p_organization), ''), v_reg_status, v_pay_status,
    nullif(trim(p_payment_ref), ''), nullif(trim(p_payment_proof_ref), '')
  )
  on conflict (event_id, user_id) do update
    set participant_category = excluded.participant_category,
        organization         = excluded.organization,
        status               = excluded.status,
        payment_status       = excluded.payment_status,
        payment_ref          = excluded.payment_ref,
        payment_proof_ref    = excluded.payment_proof_ref
  returning id into v_reg_id;

  if v_reg_status = 'confirmed' then
    v_ticket_code := 'EC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.tickets (registration_id, event_id, user_id, ticket_code)
    values (v_reg_id, p_event_id, p_user_id, v_ticket_code)
    returning id, qr_token into v_ticket_id, v_qr_token;
  end if;

  return jsonb_build_object(
    'registration_id', v_reg_id,
    'status', v_reg_status,
    'payment_status', v_pay_status,
    'ticket_id', v_ticket_id,
    'ticket_code', v_ticket_code,
    'qr_token', v_qr_token
  );
end;
$$;

revoke all on function public.register_for_event(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, text, text, text) to service_role;

-- Atomic paid-event payment verification & ticket issuance
create or replace function public.verify_registration_payment(
  p_registration_id uuid,
  p_verifier_id     uuid,
  p_decision        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg         record;
  v_ticket_id   uuid;
  v_ticket_code text;
  v_qr_token    uuid;
begin
  if p_decision not in ('verified', 'rejected') then
    raise exception 'Decision must be verified or rejected.';
  end if;

  select * into v_reg
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'Registration not found.';
  end if;

  if not public.can_manage_event(v_reg.event_id, p_verifier_id) then
    raise exception 'Only Event Leads (SPOCs) or Advisors can verify payments.';
  end if;

  if v_reg.payment_status <> 'pending_verification' then
    raise exception 'Registration is not awaiting payment verification.';
  end if;

  if p_decision = 'verified' then
    update public.registrations
    set status              = 'confirmed',
        payment_status      = 'verified',
        payment_verified_by = p_verifier_id,
        payment_verified_at = now()
    where id = p_registration_id;

    v_ticket_code := 'EC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.tickets (registration_id, event_id, user_id, ticket_code)
    values (p_registration_id, v_reg.event_id, v_reg.user_id, v_ticket_code)
    on conflict (registration_id) do update set issued_at = public.tickets.issued_at
    returning id, qr_token, ticket_code into v_ticket_id, v_qr_token, v_ticket_code;
  else
    update public.registrations
    set status              = 'cancelled',
        payment_status      = 'rejected',
        payment_verified_by = p_verifier_id,
        payment_verified_at = now()
    where id = p_registration_id;
  end if;

  return jsonb_build_object(
    'registration_id', p_registration_id,
    'user_id', v_reg.user_id,
    'event_id', v_reg.event_id,
    'decision', p_decision,
    'ticket_id', v_ticket_id,
    'ticket_code', v_ticket_code,
    'qr_token', v_qr_token
  );
end;
$$;

revoke all on function public.verify_registration_payment(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.verify_registration_payment(uuid, uuid, text) to service_role;

-- Atomic RD QR check-in
create or replace function public.checkin_by_qr(
  p_event_id   uuid,
  p_qr_token   uuid,
  p_scanner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event   record;
  v_ticket  record;
  v_reg     record;
  v_profile record;
  v_att     record;
begin
  if not public.is_rd_or_manager(p_event_id, p_scanner_id) then
    raise exception 'Only Registration & Check-in (RD) members, SPOCs, or Advisors can scan tickets.';
  end if;

  select id, status, google_sheet_id into v_event
  from public.events
  where id = p_event_id;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status in ('closed', 'archived') then
    raise exception 'Event is closed. Check-ins are disabled.';
  end if;

  select * into v_ticket
  from public.tickets
  where qr_token = p_qr_token;

  if not found then
    raise exception 'Invalid ticket QR code.';
  end if;

  if v_ticket.event_id <> p_event_id then
    raise exception 'Wrong event: this ticket belongs to a different event.';
  end if;

  select * into v_reg
  from public.registrations
  where id = v_ticket.registration_id
  for update;

  if v_reg.status <> 'confirmed' then
    raise exception 'Registration is % and cannot be checked in.', v_reg.status;
  end if;

  select full_name, college into v_profile
  from public.profiles
  where id = v_reg.user_id;

  select * into v_att
  from public.attendance_logs
  where registration_id = v_reg.id;

  if found then
    return jsonb_build_object(
      'already_checked_in', true,
      'checked_in_at', v_att.checked_in_at,
      'ticket_code', v_ticket.ticket_code,
      'participant_name', coalesce(v_profile.full_name, 'Participant')
    );
  end if;

  insert into public.attendance_logs (registration_id, event_id, checked_in_by)
  values (v_reg.id, p_event_id, p_scanner_id)
  returning * into v_att;

  return jsonb_build_object(
    'already_checked_in', false,
    'attendance_id', v_att.id,
    'checked_in_at', v_att.checked_in_at,
    'ticket_code', v_ticket.ticket_code,
    'participant_name', coalesce(v_profile.full_name, 'Participant'),
    'participant_category', v_reg.participant_category,
    'organization', coalesce(v_reg.organization, v_profile.college, ''),
    'google_sheet_id', v_event.google_sheet_id
  );
end;
$$;

revoke all on function public.checkin_by_qr(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.checkin_by_qr(uuid, uuid, uuid) to service_role;

-- -------------------------------------------------------------------------
-- 4. RLS POLICIES
-- -------------------------------------------------------------------------

alter table public.registrations   enable row level security;
alter table public.tickets         enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.announcements   enable row level security;

-- REGISTRATIONS
drop policy if exists "registrations_own_read" on public.registrations;
create policy "registrations_own_read"
  on public.registrations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "registrations_rd_read" on public.registrations;
create policy "registrations_rd_read"
  on public.registrations for select
  to authenticated
  using (public.is_rd_or_manager(event_id, auth.uid()));

-- TICKETS
drop policy if exists "tickets_own_read" on public.tickets;
create policy "tickets_own_read"
  on public.tickets for select
  to authenticated
  using (user_id = auth.uid());

-- ATTENDANCE_LOGS
drop policy if exists "attendance_own_read" on public.attendance_logs;
create policy "attendance_own_read"
  on public.attendance_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.registrations r
      where r.id = attendance_logs.registration_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "attendance_rd_read" on public.attendance_logs;
create policy "attendance_rd_read"
  on public.attendance_logs for select
  to authenticated
  using (public.is_rd_or_manager(event_id, auth.uid()));

-- ANNOUNCEMENTS
drop policy if exists "announcements_read" on public.announcements;
create policy "announcements_read"
  on public.announcements for select
  to authenticated
  using (
    event_id is null
    or public.can_access_event_workspace(event_id, auth.uid())
    or exists (
      select 1 from public.registrations r
      where r.event_id = announcements.event_id
        and r.user_id = auth.uid()
        and r.status <> 'cancelled'
    )
  );

drop policy if exists "announcements_manage_insert" on public.announcements;
create policy "announcements_manage_insert"
  on public.announcements for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (event_id is null and public.is_advisor_or_above(auth.uid()))
      or (event_id is not null and public.can_manage_event(event_id, auth.uid()))
    )
  );

-- -------------------------------------------------------------------------
-- 5. INDEXES
-- -------------------------------------------------------------------------

create index if not exists idx_registrations_event_status on public.registrations (event_id, status);
create index if not exists idx_registrations_user on public.registrations (user_id, created_at desc);
create index if not exists idx_tickets_qr_token on public.tickets (qr_token);
create index if not exists idx_attendance_event on public.attendance_logs (event_id, checked_in_at desc);
create index if not exists idx_announcements_event on public.announcements (event_id, created_at desc);
