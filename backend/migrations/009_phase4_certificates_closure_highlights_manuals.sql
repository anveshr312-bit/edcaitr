-- =============================================================================
-- Migration 009: Phase 4 — Certificates, Exports, Closure, Highlights & Manuals
-- Project: EDC AITR (Entrepreneurship Development Cell, AITR)
-- Apply after: 008_phase3_registrations_tickets_attendance.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. EXTEND AUDIT_EVENT & EVENTS TABLE
-- -------------------------------------------------------------------------

alter type public.audit_event add value if not exists 'event_closed';
alter type public.audit_event add value if not exists 'event_reopened';
alter type public.audit_event add value if not exists 'event_archived';
alter type public.audit_event add value if not exists 'certificate_issued';

alter table public.events
  add column if not exists closed_at              timestamptz,
  add column if not exists closed_by              uuid references public.profiles(id),
  add column if not exists reopen_reason          text,
  add column if not exists drive_folder_url       text,
  add column if not exists final_report_url       text,
  add column if not exists published_social_links jsonb not null default '[]'::jsonb;

-- -------------------------------------------------------------------------
-- 2. EVENT HIGHLIGHTS, EVENT MANUALS & CERTIFICATES
-- -------------------------------------------------------------------------

create table if not exists public.event_highlights (
  id            uuid        primary key default gen_random_uuid(),
  event_id      uuid        not null references public.events(id) on delete cascade,
  title         text        not null,
  caption       text,
  media_type    text        not null default 'image',
  media_ref     text        not null,
  is_published  boolean     not null default false,
  display_order integer     not null default 0,
  created_by    uuid        not null references public.profiles(id),
  created_at    timestamptz not null default now(),

  constraint event_highlights_media_type check (media_type in ('image', 'video'))
);

create table if not exists public.event_manuals (
  id           uuid        primary key default gen_random_uuid(),
  event_id     uuid        not null references public.events(id) on delete cascade,
  title        text        not null,
  description  text,
  file_ref     text        not null,
  file_size_kb integer,
  is_public    boolean     not null default true,
  created_by   uuid        not null references public.profiles(id),
  created_at   timestamptz not null default now()
);

create table if not exists public.certificates (
  id               uuid        primary key default gen_random_uuid(),
  event_id         uuid        not null references public.events(id) on delete cascade,
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  certificate_code text        not null unique,
  title            text        not null default 'Certificate of Participation',
  file_ref         text,
  issued_by        uuid        not null references public.profiles(id),
  issued_at        timestamptz not null default now(),

  constraint certificates_unique_event_user unique (event_id, user_id)
);

-- -------------------------------------------------------------------------
-- 3. PUBLIC READ RPCS (NEVER EXPOSE INTERNAL DRIVE/REPORT LINKS)
-- -------------------------------------------------------------------------

create or replace function public.get_public_event_highlights(p_event_id uuid)
returns table (
  id            uuid,
  title         text,
  caption       text,
  media_type    text,
  media_ref     text,
  display_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.title, h.caption, h.media_type, h.media_ref, h.display_order
  from public.event_highlights h
  join public.events e on e.id = h.event_id
  where h.event_id = p_event_id
    and h.is_published = true
    and e.audience = 'public'
    and e.status in ('published', 'ongoing', 'wrap_up', 'closed', 'archived')
  order by h.display_order asc, h.created_at desc;
$$;

revoke all on function public.get_public_event_highlights(uuid) from public;
grant execute on function public.get_public_event_highlights(uuid) to anon, authenticated;

create or replace function public.get_public_event_manuals(p_event_id uuid)
returns table (
  id           uuid,
  title        text,
  description  text,
  file_ref     text,
  file_size_kb integer
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.title, m.description, m.file_ref, m.file_size_kb
  from public.event_manuals m
  join public.events e on e.id = m.event_id
  where m.event_id = p_event_id
    and m.is_public = true
    and e.audience = 'public'
    and e.status in ('published', 'ongoing', 'wrap_up', 'closed', 'archived')
  order by m.created_at asc;
$$;

revoke all on function public.get_public_event_manuals(uuid) from public;
grant execute on function public.get_public_event_manuals(uuid) to anon, authenticated;

-- -------------------------------------------------------------------------
-- 4. ATOMIC CLOSURE, REOPEN & CERTIFICATE ISSUANCE RPCS
-- -------------------------------------------------------------------------

create or replace function public.transition_event_closure(
  p_event_id   uuid,
  p_actor_id   uuid,
  p_action     text,
  p_reason     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
begin
  if p_action not in ('close', 'archive', 'reopen') then
    raise exception 'Invalid closure action.';
  end if;

  if not public.can_manage_event(p_event_id, p_actor_id) then
    raise exception 'Only Event Leads (SPOCs), Advisors, or the Director can manage event closure.';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Event not found.';
  end if;

  if p_action = 'close' then
    update public.events
    set status    = 'closed',
        closed_at = coalesce(closed_at, now()),
        closed_by = coalesce(closed_by, p_actor_id)
    where id = p_event_id;

    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (p_actor_id, 'event_closed', p_event_id, 'event', jsonb_build_object('previous_status', v_event.status));

  elsif p_action = 'archive' then
    if v_event.status <> 'closed' then
      raise exception 'Event must be closed before archiving.';
    end if;
    update public.events set status = 'archived' where id = p_event_id;

    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (p_actor_id, 'event_archived', p_event_id, 'event', '{}'::jsonb);

  elsif p_action = 'reopen' then
    if p_reason is null or length(trim(p_reason)) < 5 then
      raise exception 'A recorded reason (min 5 characters) is required to reopen a closed event.';
    end if;
    update public.events
    set status        = 'wrap_up',
        reopen_reason = trim(p_reason)
    where id = p_event_id;

    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (p_actor_id, 'event_reopened', p_event_id, 'event', jsonb_build_object('reason', trim(p_reason)));
  end if;

  return jsonb_build_object('ok', true, 'action', p_action);
end;
$$;

revoke all on function public.transition_event_closure(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.transition_event_closure(uuid, uuid, text, text) to service_role;

create or replace function public.issue_event_certificates(
  p_event_id    uuid,
  p_issuer_id   uuid,
  p_title       text default 'Certificate of Participation',
  p_only_attended boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec    record;
  v_issued int := 0;
  v_code   text;
begin
  if not public.can_manage_event(p_event_id, p_issuer_id) then
    raise exception 'Only Event Leads (SPOCs), Advisors, or the Director can issue certificates.';
  end if;

  for v_rec in
    select distinct r.user_id
    from public.registrations r
    left join public.attendance_logs a on a.registration_id = r.id
    where r.event_id = p_event_id
      and r.status = 'confirmed'
      and (p_only_attended = false or a.id is not null)
  loop
    v_code := 'CERT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.certificates (event_id, user_id, certificate_code, title, issued_by)
    values (p_event_id, v_rec.user_id, v_code, coalesce(nullif(trim(p_title), ''), 'Certificate of Participation'), p_issuer_id)
    on conflict (event_id, user_id) do nothing;

    if found then
      v_issued := v_issued + 1;
    end if;
  end loop;

  if v_issued > 0 then
    insert into public.audit_log (actor_id, event, target_id, target_type, detail)
    values (p_issuer_id, 'certificate_issued', p_event_id, 'event', jsonb_build_object('issued_count', v_issued));
  end if;

  return jsonb_build_object('ok', true, 'issued_count', v_issued);
end;
$$;

revoke all on function public.issue_event_certificates(uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.issue_event_certificates(uuid, uuid, text, boolean) to service_role;

-- -------------------------------------------------------------------------
-- 5. RLS POLICIES
-- -------------------------------------------------------------------------

alter table public.event_highlights enable row level security;
alter table public.event_manuals    enable row level security;
alter table public.certificates     enable row level security;

-- EVENT_HIGHLIGHTS
drop policy if exists "event_highlights_manage_all" on public.event_highlights;
create policy "event_highlights_manage_all"
  on public.event_highlights for all
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()))
  with check (public.can_manage_event(event_id, auth.uid()));

-- EVENT_MANUALS (public reads via get_public_event_manuals; internal manuals for event workspace)
drop policy if exists "event_manuals_workspace_read" on public.event_manuals;
create policy "event_manuals_workspace_read"
  on public.event_manuals for select
  to authenticated
  using (public.can_access_event_workspace(event_id, auth.uid()));

drop policy if exists "event_manuals_manage_write" on public.event_manuals;
create policy "event_manuals_manage_write"
  on public.event_manuals for all
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()))
  with check (public.can_manage_event(event_id, auth.uid()));

-- CERTIFICATES
drop policy if exists "certificates_own_read" on public.certificates;
create policy "certificates_own_read"
  on public.certificates for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "certificates_manage_read" on public.certificates;
create policy "certificates_manage_read"
  on public.certificates for select
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()));

-- -------------------------------------------------------------------------
-- 6. INDEXES
-- -------------------------------------------------------------------------

create index if not exists idx_event_highlights_event on public.event_highlights (event_id, is_published, display_order);
create index if not exists idx_event_manuals_event on public.event_manuals (event_id);
create index if not exists idx_certificates_user on public.certificates (user_id, issued_at desc);
create index if not exists idx_certificates_event on public.certificates (event_id);
