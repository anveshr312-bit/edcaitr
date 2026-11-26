-- Tracks inherit the event fee. Managers configure real tracks per event.
create table public.event_tracks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  capacity integer check (capacity > 0),
  unique(event_id, title)
);
alter table public.event_tracks enable row level security;
create policy event_tracks_read on public.event_tracks for select using (exists(select 1 from public.events e where e.id = event_tracks.event_id));
create policy event_tracks_manage on public.event_tracks for all to authenticated using (public.can_manage_event(event_id,auth.uid())) with check (public.can_manage_event(event_id,auth.uid()));
alter table public.registrations add column track_id uuid references public.event_tracks(id);
create index registrations_track_idx on public.registrations(track_id);

create or replace function public.register_for_event(
  p_event_id          uuid,
  p_user_id           uuid,
  p_category          text,
  p_organization      text,
  p_payment_ref       text,
  p_payment_proof_ref text,
  p_track_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event         record;
  v_track         public.event_tracks%rowtype;
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

  if v_event.audience <> 'public' and public.get_user_role(p_user_id) = 'participant' then
    raise exception 'Registration unavailable for this audience.';
  end if;

  if v_event.ends_at <= now() then
    raise exception 'Event has ended.';
  end if;

  if v_event.status not in ('published', 'ongoing') then
    raise exception 'Registrations are not open for this event.';
  end if;

  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'Registration has not opened yet.';
  end if;

  if v_event.registration_closes_at is not null and now() >= v_event.registration_closes_at then
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

  if p_track_id is not null then
    select * into v_track from public.event_tracks where id = p_track_id and event_id = p_event_id for update;
    if not found then raise exception 'Invalid event track.'; end if;
    if v_track.capacity is not null and (select count(*) from public.registrations where track_id = p_track_id and status <> 'cancelled') >= v_track.capacity then
      raise exception 'Track is full.';
    end if;
  elsif exists (select 1 from public.event_tracks where event_id = p_event_id) then
    raise exception 'Select a track.';
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
    event_id, user_id, track_id, participant_category, organization,
    status, payment_status, payment_ref, payment_proof_ref
  )
  values (
    p_event_id, p_user_id, p_track_id, coalesce(nullif(trim(p_category), ''), 'student'),
    nullif(trim(p_organization), ''), v_reg_status, v_pay_status,
    nullif(trim(p_payment_ref), ''), nullif(trim(p_payment_proof_ref), '')
  )
  on conflict (event_id, user_id) do update
    set track_id = excluded.track_id,
        participant_category = excluded.participant_category,
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

revoke all on function public.register_for_event(uuid, uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, text, text, text, uuid) to service_role;

-- Preserve callers using the original RPC signature.
create or replace function public.register_for_event(
  p_event_id          uuid,
  p_user_id           uuid,
  p_category          text default 'student',
  p_organization      text default null,
  p_payment_ref       text default null,
  p_payment_proof_ref text default null
)
returns jsonb
language sql security definer set search_path = public as $$
  select public.register_for_event(p_event_id, p_user_id, p_category, p_organization, p_payment_ref, p_payment_proof_ref, null);
$$;
revoke all on function public.register_for_event(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, text, text, text) to service_role;
