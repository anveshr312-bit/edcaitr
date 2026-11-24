-- =============================================================================
-- Migration 003: Director bootstrap process
-- Project: E-Cell AITR
-- =============================================================================
-- SECURITY MODEL
-- The Director bootstrap MUST be performed by the actual Director:
--   1. The Director registers normally (email+password with 2FA or Google).
--   2. They retrieve their auth.uid() from the Supabase Dashboard → Auth → Users.
--   3. The person with database access (the technical owner) runs this script
--      with the Director's uid substituted, using the service-role key only
--      in the Supabase SQL Editor (never in client code).
--   4. After bootstrap, delete this script from chat history.
--   5. Enabling MFA is done in the app or Supabase dashboard; it cannot be
--      enforced by SQL alone — enforcement is at the server function boundary.
--
-- Only one Director is bootstrapped this way. Future Director changes
-- go through the normal Director approval workflow.
-- =============================================================================

-- Step 1: replace '<DIRECTOR_AUTH_UID>' with the actual uuid before running.
do $$
declare
  v_director_uid uuid := '1b544c41-2de3-46a6-a46f-7461917ef746';
  v_existing     int;
begin
  -- Guard: refuse if placeholder was not replaced
  if v_director_uid::text = '<DIRECTOR_AUTH_UID>' then
    raise exception 'Replace <DIRECTOR_AUTH_UID> with the real director user id before running this migration.';
  end if;

  -- Guard: profile must exist (user must have signed up first)
  if not exists (select 1 from public.profiles where id = v_director_uid) then
    raise exception 'Profile not found for %. The user must sign up before being bootstrapped as Director.', v_director_uid;
  end if;

  -- Guard: refuse to overwrite an existing Director
  select count(*) into v_existing
  from public.org_memberships
  where role = 'director' and status = 'approved' and effective_until is null;

  if v_existing > 0 then
    raise exception 'An active Director already exists. Use the promotion workflow to change Directors.';
  end if;

  -- Insert the Director membership
  insert into public.org_memberships (user_id, role, status, reviewed_by, reviewed_at, effective_from, review_note)
  values (
    v_director_uid,
    'director',
    'approved',
    NULL,             -- system bootstrap: no human reviewer; reviewed_by must be NULL to satisfy no-self-review constraint
    now(),
    current_date,
    'Initial Director bootstrap — performed by technical owner via service-role SQL.'
  );

  -- Write audit record
  insert into public.audit_log (actor_id, event, target_id, target_type, detail)
  values (
    v_director_uid,
    'director_action',
    v_director_uid,
    'org_membership',
    jsonb_build_object('action', 'director_bootstrap', 'note', 'One-time bootstrap via service-role SQL')
  );

  raise notice 'Director bootstrapped successfully for user %.', v_director_uid;
end;
$$;
