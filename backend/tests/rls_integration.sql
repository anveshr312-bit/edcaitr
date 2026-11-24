-- =============================================================================
-- RLS Integration Tests
-- Run in Supabase SQL Editor with the anon role to verify policies.
-- These are diagnostic queries; they will return empty sets or errors if
-- RLS is working correctly.
-- =============================================================================

-- -------------------------------------------------------------------------
-- Test 1: Unauthenticated access to profiles is restricted to is_public=true
-- -------------------------------------------------------------------------
-- Expected: Returns only rows where is_public = true (may be empty)
-- Run as: anon role
set role anon;
select id, full_name from public.profiles limit 10;
-- ✓ PASS if no non-public profiles are returned

-- -------------------------------------------------------------------------
-- Test 2: Participant cannot read org_memberships of other users
-- -------------------------------------------------------------------------
-- Expected: Returns only rows where user_id = auth.uid() (the test participant)
-- (requires a valid participant JWT — test from application or Supabase UI)
-- set role authenticated;
-- set request.jwt.claims = '{"sub":"<participant-uuid>","role":"authenticated"}';
-- select * from public.org_memberships; -- should return only own rows or empty

-- -------------------------------------------------------------------------
-- Test 3: Participant cannot insert their own org_membership
-- -------------------------------------------------------------------------
-- Expected: ERROR — policy violation (no policy allows participant to insert)
-- insert into public.org_memberships (user_id, role, status)
-- values ('<participant-uuid>', 'director', 'approved');
-- ✓ PASS if INSERT fails with RLS violation

-- -------------------------------------------------------------------------
-- Test 4: Participant cannot approve their own application
-- -------------------------------------------------------------------------
-- Expected: UPDATE fails or reviewed_by must equal auth.uid() AND applicant_id <> auth.uid()
-- update public.applications
-- set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
-- where applicant_id = auth.uid();
-- ✓ PASS if UPDATE is rejected (self-review constraint)

-- -------------------------------------------------------------------------
-- Test 5: Advisor cannot read Director audit_log entries
-- -------------------------------------------------------------------------
-- Expected: Returns no rows where event = 'director_action'
-- (requires advisor JWT)
-- select * from public.audit_log where event = 'director_action';
-- ✓ PASS if 0 rows returned

-- -------------------------------------------------------------------------
-- Test 6: Verify get_user_role returns 'participant' for new user
-- -------------------------------------------------------------------------
-- Expected: 'participant'
select public.get_user_role('<new-user-uuid>');
-- ✓ PASS if result = 'participant'

-- -------------------------------------------------------------------------
-- Test 7: Verify tenure_history is append-only (no updates)
-- -------------------------------------------------------------------------
-- Expected: ERROR — no UPDATE policy exists
-- update public.tenure_history set role = 'director' where true;
-- ✓ PASS if UPDATE fails with RLS violation

-- -------------------------------------------------------------------------
-- Summary
-- -------------------------------------------------------------------------
-- Run each block separately in the Supabase SQL Editor.
-- For authenticated tests, use the Supabase Auth Helpers or test JWTs.
-- Document results in docs/DATABASE_AND_RBAC.md → Verification section.
