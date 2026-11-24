# E-Cell AITR — Web Platform

Next.js App Router + TypeScript + Supabase Auth & PostgreSQL platform for E-Cell AITR.

## Current Implementation Status

**Implemented & Deployed (Auth + RBAC Foundation):**
- **Supabase SSR Authentication:** Email/password signup and sign-in, email confirmation, password recovery/reset, Google OAuth, `/auth/callback` proxy-aware redirect validation, and session refresh middleware.
- **Database Schema & RLS (`backend/migrations/001`–`005`):** Normalized `profiles`, `org_memberships`, `applications`, `tenure_history`, and `audit_log` tables with Row Level Security, public-field isolation (`get_public_team_profiles()`), privileged-field update guards, and atomic PostgreSQL RPCs for approvals, promotions, and revocations.
- **Director MFA & Role Workflows:** `/account`, `/account/dashboard`, `/account/profile`, `/account/mfa` (TOTP enrollment/verification), `/account/apply`, `/account/applications`, `/account/team`, and server-gated API endpoints (`/api/auth/me`, `/api/applications/review`, `/api/applications/nominate`, `/api/memberships/revoke`).

**Remaining Modules (Planned in `docs/IMPLEMENTATION_ROADMAP.md`):**
- Public Website pages (Events, About, Team, Contact), Participant Portal (Registrations, Tickets, Certificates), Team Workspace, Event Management, Operational Teams & Tasks, QR Check-in & Google Sheets sync, Exports, Event Closure, and Alumni Connect.

## Local Setup

1. From `frontend/`, run `npm install`.
2. Copy `frontend/.env.example` to `frontend/.env.local` and populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-only).
3. Apply SQL migrations `001` through `005` in order in the Supabase SQL Editor (see `docs/DATABASE_AND_RBAC.md`).
4. Run `npm run dev` from `frontend/`.

## Documentation

- `docs/SUPABASE_SETUP.md` — Supabase, Brevo SMTP, and Google Cloud OAuth setup
- `docs/DATABASE_AND_RBAC.md` — Schema, RLS policies, MFA, and Director bootstrap
- `docs/VERCEL_DEPLOYMENT.md` — Vercel configuration and deployment checklist
- `docs/IMPLEMENTATION_ROADMAP.md` — Architecture plan for remaining modules
- `../ecell-website-requirements.md` — Functional requirements source of truth

## Verification Commands

From `frontend/`:
- `npm run typecheck`
- `npm run build`
- `npx tsx ../backend/tests/auth.test.ts`
