alter policy events_public_read on public.events using (audience = 'public' and status in ('published','ongoing','wrap_up','closed','archived','cancelled'));

alter policy tasks_workspace_read on public.tasks using (
  public.can_manage_event(event_id, auth.uid()) or assignee_id = auth.uid() or exists (
    select 1 from public.event_team_members m where m.event_id = tasks.event_id and m.team_code = tasks.team_code and m.user_id = auth.uid()
  )
);

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

  if v_event.status in ('closed', 'archived', 'cancelled') then
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
          and (effective_from is null or effective_from <= current_date)
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
    and (m.effective_from is null or m.effective_from <= current_date)
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
     or new.display_order is distinct from old.display_order
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

create or replace function public.guard_task_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;

  if new.event_id is distinct from old.event_id or new.created_by is distinct from old.created_by then
    raise exception 'Task event and creator cannot be changed.';
  end if;

  if public.can_manage_event(old.event_id, v_uid) then
    return new;
  end if;

  if new.title is distinct from old.title
     or new.brief is distinct from old.brief
     or new.deliverable_spec is distinct from old.deliverable_spec
     or new.team_code is distinct from old.team_code
     or new.assignee_id is distinct from old.assignee_id
     or new.due_at is distinct from old.due_at then
    raise exception 'Only Event Leads (SPOCs) or Advisors can modify task structure or assignments.';
  end if;

  if new.status = 'approved' and old.status <> 'approved' then
    raise exception 'Only Event Leads (SPOCs) or Advisors can approve tasks.';
  end if;

  return new;
end;
$$;
