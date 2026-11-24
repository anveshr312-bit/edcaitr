# Database Schema & RBAC — E-Cell AITR

**Status:** Foundation implemented — migrations ready to apply.
**Last updated:** November 2026.

---

## 1. Architecture Overview

```
auth.users (Supabase Auth)
     │
     ├──► public.profiles          ← One row per user, auto-created on signup
     │
     ├──► public.org_memberships   ← Administrative / alumni roles, approval lifecycle
     │
     ├──► public.applications      ← All role applications & promotion nominations
     │
     ├──► public.tenure_history    ← Append-only record of past memberships
     │
     └──► public.audit_log         ← Append-only audit trail of sensitive actions
```

A user is always a **participant** (baseline) the moment they sign up. Administrative roles are additive — stored in `org_memberships` — and do not replace the participant identity.

---

## 2. Role Hierarchy

| Role | Rank | Description |
|------|------|-------------|
| `director` | 4 | Full organization-wide authority. Mandatory authenticator-app MFA for privileged actions. |
| `advisor` | 3 | Organization-wide view/edit. Oversees Core Team. Approves Core Team applications. |
| `core_team` | 2 | Approved organization member. Can create events, receive assignments. |
| `alumni` | 1 | Verified former member. Alumni Connect eligible. No current administrative access. |
| `participant` | 0 | Default for all authenticated users. Access to own registrations, certificates, etc. |

A single account may hold `participant` baseline **and** an administrative role concurrently — they are not mutually exclusive.

---

## 3. Database Tables

### 3.1 `public.profiles`
One row per `auth.users` entry. Auto-created by trigger `on_auth_user_created`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | References `auth.users(id)` |
| `full_name` | text | Defaults to empty string |
| `phone` | text | Optional |
| `bio` | text | For public Team page |
| `designation` | text | e.g. "Frontend Lead" |
| `linkedin_url` | text | Must start with `https?://` |
| `avatar_ref` | text | ImageKit path — not a raw URL |
| `college` | text | |
| `enrollment_no` | text | Optional; not all participants are students |
| `is_public` | boolean | Controls public Team page visibility |
| `created_at` / `updated_at` | timestamptz | Auto-managed |

### 3.2 `public.org_memberships`
Active and historical administrative memberships.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `profiles(id)` |
| `role` | `app_role` | One of `core_team`, `advisor`, `director`, `alumni` |
| `status` | `membership_status` | `pending`, `approved`, `rejected`, `suspended`, `departed` |
| `reviewed_by` | uuid | FK → `profiles(id)` — null until reviewed |
| `reviewed_at` | timestamptz | |
| `review_note` | text | |
| `effective_from` / `effective_until` | date | Tenure window; `effective_until = null` means currently active |
| `handover_date` / `handover_note` | date/text | For scheduled departures |

**Key constraint:** `user_id <> reviewed_by` — prevents self-approval at the database level.

### 3.3 `public.applications`
Role applications and promotion nominations.

| Column | Type | Notes |
|--------|------|-------|
| `applicant_id` | uuid | Who submitted |
| `application_type` | enum | `advisor_application`, `core_team_application`, `alumni_verification`, `promotion_nomination` |
| `status` | `membership_status` | Starts as `pending` |
| `statement` | text | Motivation text |
| `reviewed_by` / `reviewed_at` | uuid/timestamptz | Set on review |
| `nominee_id` | uuid | Only for `promotion_nomination` — the Core Team member nominated |

**Key constraint:** `applicant_id <> reviewed_by` — self-review blocked at DB level.

### 3.4 `public.tenure_history`
Append-only. Populated by trigger `archive_on_membership_change` when a membership departs/is suspended/rejected.

### 3.5 `public.audit_log`
Append-only. All sensitive administrative actions are recorded with actor, event type, target, and structured JSON detail. Never includes passwords or keys.

---

## 4. Row Level Security Policies

All tables have RLS enabled. The service-role key (server-only) bypasses RLS for triggers and admin workflows. The anon key and authenticated user sessions respect all policies.

### `profiles`
| Policy | Who | What |
|--------|-----|------|
| `profiles_public_read` | Anyone (anon + auth) | Only `is_public = true` |
| `profiles_own_read` | Authenticated | Own row only |
| `profiles_advisor_read_all` | Advisor+ | All rows |
| `profiles_own_update` | Authenticated | Own row only |
| `profiles_director_update_any` | Director | Any row (for ordering, visibility) |
| (Insert) | Trigger only | No direct client insert |

### `org_memberships`
| Policy | Who | What |
|--------|-----|------|
| `memberships_own_read` | Authenticated | Own memberships |
| `memberships_core_team_read` | Core Team+ | All memberships |
| `memberships_director_write` | Director | Full write access |

> **Note:** Direct client inserts are blocked for all non-Director users. Membership creation on application approval is performed server-side by the admin client (service-role).

### `applications`
| Policy | Who | What |
|--------|-----|------|
| `applications_own_read` | Authenticated | Own applications |
| `applications_advisor_read` | Advisor+ | Core Team / alumni applications |
| `applications_director_read_all` | Director | All applications |
| `applications_self_insert` | Authenticated | Own application, `status = 'pending'`, no pre-set reviewer |
| `applications_advisor_review` | Advisor+ | Update Core Team / alumni apps; `applicant_id <> auth.uid()` |
| `applications_director_review` | Director | Update any app; `applicant_id <> auth.uid()` |
| `applications_advisor_nominate` | Advisor+ | Insert `promotion_nomination` with a valid `nominee_id <> auth.uid()` |

### `tenure_history`
| Policy | Who | What |
|--------|-----|------|
| `tenure_own_read` | Authenticated | Own history |
| `tenure_admin_read` | Advisor+ | All history |
| `tenure_public_read` | Anyone | `approved` / `departed` status (for Past Teams page) |
| (Write) | Trigger only | No client writes |

### `audit_log`
| Policy | Who | What |
|--------|-----|------|
| `audit_director_read` | Director | All entries |
| `audit_advisor_read` | Advisor+ | All except `director_action` entries |
| (Write) | Server-side only | No client writes |

---

## 5. Server Authorization Utilities

Location: `frontend/src/lib/auth/authorization.ts`

| Export | Purpose |
|--------|---------|
| `createSessionClient()` | Anon-key Supabase client scoped to the cookie session |
| `createAdminClient()` | Service-role client — **server only, never sent to browser** |
| `getUser()` | Resolves authenticated user from session (cached per request) |
| `getUserRole(userId)` | Calls DB function `get_user_role()` (cached per request) |
| `getUserContext()` | Full `{id, email, role, hasMfa}` for the current caller |
| `requireRole(ctx, minimum)` | Returns `AuthorizationError` or `null` |
| `requireDirectorMfa(ctx)` | Requires `director` role AND `hasMfa = true` |
| `withAuth(minimum, handler)` | Route handler wrapper for role-gated endpoints |
| `withDirectorMfa(handler)` | Route handler wrapper requiring Director + MFA |

### Application Workflow Functions

Location: `frontend/src/lib/workflows/applications.ts`

| Function | Caller | Description |
|----------|--------|-------------|
| `submitApplication(type, statement)` | Any authenticated user | Submit own application |
| `reviewApplication(id, decision, note)` | Advisor+ | Review Core Team / alumni apps |
| `nominateForPromotion(nomineeId, statement)` | Advisor+ | Nominate Core Team for Advisor |
| `approvePromotion(id, decision, note)` | Director + MFA | Approve/reject promotion nomination |
| `revokeMembership(userId, status, reason)` | Director + MFA | Suspend or depart a member |

---

## 6. Director Bootstrap Process

The initial Director account cannot be created through the application workflow. The bootstrap is a one-time operation:

1. The Director registers a normal account (email+password or Google).
2. The Director sets up authenticator-app MFA in the Supabase Auth dashboard.
3. The technical owner (Supabase project admin) locates the Director's `auth.uid()` in Supabase Dashboard → Authentication → Users.
4. The technical owner opens `backend/migrations/003_director_bootstrap.sql`, replaces `<DIRECTOR_AUTH_UID>` with the actual UUID, and runs it in the **Supabase SQL Editor** (which uses the service-role context).
5. The script refuses to run if:
   - The placeholder was not replaced.
   - The user's profile does not exist (they haven't signed up yet).
   - An active Director already exists.
6. After running, delete or redact the script from any shared location.

**No passwords, secrets or hardcoded credentials are involved.** The Director's password is set only by the Director.

---

## 7. MFA Enforcement

Director-gated server functions call `requireDirectorMfa(ctx)`, which checks:
- `ctx.role === 'director'` (from DB function, not client input)
- `ctx.hasMfa === true` (from `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` returning `aal2`)

If either check fails, the function returns a `403 Forbidden` or `mfa_required` error immediately — no database query is performed.

The Director must enroll a TOTP authenticator app in Supabase's built-in MFA:
- Supabase Dashboard → Authentication → MFA, or
- Via `supabase.auth.mfa.enroll()` in the app UI (to be implemented in the account module).

---

## 8. Applying Migrations

Run migrations **in order** in the Supabase SQL Editor (or via `supabase db push` if using the CLI):

```
backend/migrations/001_profiles_and_roles.sql   ← Tables, enums, triggers, helper functions
backend/migrations/002_rls_policies.sql          ← All RLS policies
backend/migrations/003_director_bootstrap.sql    ← Director bootstrap (edit UUID first)
backend/migrations/004_director_mfa_rls.sql      ← DB-level aal2 MFA enforcement for Director
backend/migrations/005_hardening_rls_and_rpcs.sql ← Public profile isolation, field guard trigger, atomic RPCs
```

> **Important:** Migrations 001 and 002 are idempotent-safe if run once. Migration 003 has guards to prevent double-bootstrapping.

---

## 9. Security Properties

| Property | Mechanism |
|----------|-----------|
| New signups have zero admin privileges | `handle_new_user` trigger creates only a `profiles` row; no `org_memberships` insert |
| Client cannot self-grant admin roles | `org_memberships` has no client-writable INSERT policy except for Director |
| Self-approval blocked | `CHECK (user_id <> reviewed_by)` at DB level + server-side guard |
| Director actions require MFA | `requireDirectorMfa()` checks `aal2` assurance level before any action |
| Role resolved server-side only | `get_user_role()` SQL function called from server; client claims are ignored |
| Audit trail is immutable | No UPDATE or DELETE policies on `audit_log` or `tenure_history` |
| Service-role key never reaches browser | `createAdminClient()` only importable in server modules; not in `NEXT_PUBLIC_*` variables |
| Historical data preserved | `archive_on_membership_change` trigger writes `tenure_history` automatically |

---

## 10. Verification

### Logic Tests (no database required)
```bash
cd a:\EDC AITR\website\frontend
npx tsx ..\backend\tests\auth.test.ts
```
Expected: all tests pass.

### RLS Integration Tests
See `backend/tests/rls_integration.sql` — run individual blocks in the Supabase SQL Editor under different roles to verify policy boundaries.

### Verified in this session
- [x] Authorization unit tests: all pass (no live Supabase required).
- [ ] RLS integration tests: **pending manual execution** in Supabase SQL Editor after migrations are applied.
- [ ] Director bootstrap: **pending** — requires the Director's `auth.uid()`.
- [ ] MFA enrollment flow: **pending** — to be implemented in account UI.
