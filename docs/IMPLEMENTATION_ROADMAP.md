# E-Cell AITR — Architecture & Implementation Roadmap

**Author:** Software Architecture Plan  
**Source of Truth:** `ecell-website-requirements.md`  
**Current Baseline:** Auth, SSR session middleware, RBAC database schema (`001`–`004`), server/DB MFA enforcement, and account/application UI deployed at `https://edcaitr.vercel.app/`.

---

## 0. Scope Guardrails & Existing Foundation

### Existing Reusable Foundation (Do Not Duplicate)
- **Auth & Sessions:** `frontend/src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `/auth/callback`
- **Authorization & RBAC:** `frontend/src/lib/auth/authorization.ts` (`getUserContext`, `requireRole`, `requireDirectorMfa`, `withAuth`, `withDirectorMfa`, `createSessionClient`, `createAdminClient`)
- **Database Tables (`backend/migrations/001`–`004`):** `profiles`, `org_memberships`, `applications`, `tenure_history`, `audit_log`, plus `get_user_role()`, `is_director()`, `is_director_with_mfa()`, `is_advisor_or_above()`, `is_core_team_or_above()`, `is_alumni_connect_eligible()`
- **Account UI:** `/account`, `/account/dashboard`, `/account/profile`, `/account/mfa`, `/account/apply`, `/account/applications`, `/account/team`

### Explicitly Excluded Scope (Section 13 — Do Not Implement)
- **Rejected Operational Teams:** Sponsorship & Partnerships, Finance & Payments team, Technical Support, Hospitality & Catering, Judging & Competition Coordination. *(Payment configuration on events remains in scope; a separate finance team does not.)*
- **Rejected Feature Proposals (unless subsequently requested):** Expanded team-registration forms, waitlists/cancellations, volunteer shifts/backups, feedback workflows, separate incident-reporting module.
- **Unadopted Providers:** Better Auth, Cloudinary, Clerk, Resend, SendGrid.

### Confirmed 12 Operational Teams (Section 9 & 13)
1. Registration & Check-in (`RD`)
2. Audio & Visual (`AV`)
3. Stage Management
4. Logistics
5. Crowd & Venue Management
6. Photography (`Clix`)
7. Guest Relations
8. Documentation & Reports
9. Anchoring *(explicitly added in Section 13)*
10. Design & Creatives
11. Video Production / Editing
12. Social Media & Publicity

---

## 1. Shared Components & Cross-Module Dependencies

To prevent duplicate implementations across the 10 modules, build these shared primitives once:

| Shared Primitive | Consumers | Design |
|---|---|---|
| **Media Reference Helper (ImageKit)** | Profiles (Module 9), Events/Highlights (Modules 1, 4, 8), Paid Event UPI QR (Module 6), Alumni Startups (Module 10) | Store ImageKit file path/IDs in PostgreSQL; generate signed upload parameters server-side (`POST /api/media/sign`) for authorized roles only; render via URL builder. |
| **Role & Event-Permission Resolver** | Modules 3, 4, 5, 6, 7, 8 | Extend `authorization.ts` with `requireEventSpoc(ctx, eventId)`, `requireOperationalTeamMember(ctx, eventId, teamCode)`, and `requireRdMember(ctx, eventId)` backed by SQL helper functions. |
| **Event Card & Detail Presenter** | Public Website (Module 1), Participant Portal (Module 2), Closed Event Archive (Module 8), Alumni Events (Module 10) | Single `events` table + audience filter (`public` vs `community_only`) and lifecycle status badge (`Draft` → `Published` → `Ongoing` → `Wrap-up` → `Closed` → `Archived`). |
| **Profile & Team Roster Queries** | Public Team Page (Module 1), SPOC/Team Selectors (Modules 4, 5), Admin Profiles (Module 9), Alumni Directory (Module 10) | Single source of truth in `profiles` + `org_memberships` + `tenure_history`. Public queries strip private fields (`phone`, `enrollment_no`, `email`). |
| **Notification / Email Dispatcher (Brevo)** | Auth (existing), Task Assignments (Module 5), Registration/Tickets (Module 6), Digests & Messages (Module 10) | Server-only Brevo SMTP/API wrapper respecting user digest opt-in preferences separately from mandatory transactional/security emails. |
| **Audit Logger** | Modules 3, 4, 6, 8, 9, 10 | Reuse `public.audit_log` via server-side helper `logAuditEvent(actorId, event, targetId, targetType, detail)`. |

---

## 2. Detailed Module Specifications

### Module 1: Public Website
- **Functional Scope:** Publicly accessible pages without sign-in: Home (E-Cell overview & highlighted events), Events (browse published/concluded events & view details), About Us, Team (current approved team & past teams by tenure), and Contact Us (organization info + inquiry submission).
- **Confirmed vs. Proposed:**
  - *Confirmed:* Home, Events, About Us, Team, Contact Us; no sign-in required; Team reuses `profiles` (`is_public = true` + approved membership) and `tenure_history` for Past Teams; concluded events remain publicly viewable.
  - *Proposed / Pending:* Public gallery placement (Section 9.6), public startup showcase (Section 19.3 — default is Alumni-only).
- **Database Dependencies:** `profiles`, `org_memberships`, `tenure_history` (existing); `events` (read-only where `status in ('published','ongoing','wrap_up','closed')` and `audience = 'public'`), `contact_inquiries` (new).
- **Auth & Authorization:** Anonymous (`anon`) read access via RLS for public tables/views; `POST /api/contact` is public with rate limiting; no admin or participant-private data exposed.
- **API / Server Actions:** Server Components for `/`, `/events`, `/events/[slug]`, `/about`, `/team`, `/contact`; `POST /api/contact` for inquiry submission.
- **Main UI Screens:** `/` (Home), `/events`, `/events/[slug]`, `/about`, `/team` (Current Team + Past Teams by tenure), `/contact`.
- **External Integrations:** ImageKit (public event posters & team photos).
- **Security Risks:** Leaking `phone`, `email`, or `enrollment_no` via `profiles` select; exposing `pending` applicants or `draft` events; spam on `/api/contact`.
- **Edge Cases:** Member with `is_public = true` but `pending`/`suspended` membership must NOT appear on `/team`; archived events hidden from `/events` list but `/events/[slug]` still accessible if previously published.
- **Acceptance Tests:**
  - `anon` query on `profiles` never returns `is_public = false` or private columns.
  - `anon` query on `events` never returns `draft` or `community_only` events.
  - Pending Core Team applicant does not appear on `/team`.

---

### Module 2: Participant Portal
- **Functional Scope:** Signed-in experience for students, founders, startup representatives, and external participants: Participant Home (highlights + events), Events (browse & register), Your Registrations (status + QR ticket), Announcements, Your Certificates, and Contact Us.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Google/email login; non-student support (do not require `enrollment_no`); view registrations, tickets/QR, announcements, certificates; contact organizers.
  - *Proposed / Pending:* Home highlighting upcoming registered events/tickets; per-registration detail view with instructions and payment status; event-specific vs general announcements.
- **Database Dependencies:** `profiles` (existing), `events`, `registrations`, `tickets`, `announcements`, `certificates` (new).
- **Auth & Authorization:** `requireRole(ctx, 'participant')` — every authenticated user has this baseline even if they also hold `core_team`/`advisor`/`director`. RLS restricts `registrations`, `tickets`, `certificates` to `user_id = auth.uid()`.
- **API / Server Actions:** `GET /api/registrations/my`, `GET /api/certificates/my`, `GET /api/announcements` (filtered by public/registered events).
- **Main UI Screens:** `/portal` (or `/dashboard`), `/portal/registrations`, `/portal/registrations/[id]`, `/portal/certificates`, `/portal/announcements`.
- **External Integrations:** Google Wallet pass link (pending issuer onboarding), ImageKit (event banners).
- **Security Risks:** IDOR on `/portal/registrations/[id]` or ticket QR endpoints allowing one participant to view another's ticket/QR.
- **Edge Cases:** Participant with incomplete profile (`college`/`enrollment_no` empty) registering as an external founder; participant later becoming Core Team retains all past registrations/certificates.
- **Acceptance Tests:**
  - Participant A receives `403`/`404` when requesting Participant B's registration or ticket QR.
  - External participant without `enrollment_no` can register for a public event.

---

### Module 3: Team Workspace
- **Functional Scope:** Internal administration and operations area for Director, Advisors, and approved Core Team members: role-scoped navigation, pending approvals, event workspace entry, **My Event Work** (assigned teams/tasks), and team management.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Separate from Participant Portal; Director has full access (with MFA for privileged actions); Advisors oversee Core Team; Core Team access follows event assignments rather than unrestricted org-wide data.
  - *Proposed / Pending:* Operational team coordinators inside events; **My Event Work** consolidated task/schedule view; audit history UI.
- **Database Dependencies:** `org_memberships`, `applications`, `audit_log` (existing); `events`, `event_spocs`, `event_team_members`, `operational_teams`, `tasks`.
- **Auth & Authorization:** `requireRole(ctx, 'core_team')` to enter workspace; sub-views gated by `advisor`/`director`/`event_spoc`. Pending applicants are blocked (`403` / redirect to `/account/dashboard`).
- **API / Server Actions:** `GET /api/workspace/my-work` (assigned events, operational teams, tasks).
- **Main UI Screens:** `/workspace` (overview + My Event Work), `/workspace/events`, `/account/applications` (existing), `/account/team` (existing).
- **External Integrations:** Google Drive links (stored as URL references, not managed permissions).
- **Security Risks:** Core Team member accessing internal participant contact lists or payment proofs of events they are not assigned to.
- **Edge Cases:** Departed/suspended member with an active browser cookie must immediately lose workspace access on next request (`get_user_role()` checks `status = 'approved'` and `effective_until`).
- **Acceptance Tests:**
  - Pending applicant and `alumni` receive `403`/redirect on `/workspace`.
  - Core Team member not assigned to Event X cannot read Event X's internal registrations or tasks.

---

### Module 4: Event Management
- **Functional Scope:** Create and configure events, designate one or more Event Leads (SPOCs) from approved Core Team/Advisors/Director, set registration capacity (fixed or unlimited), configure free vs. paid (amount + UPI ID/QR), manage guests (with LinkedIn/social links), and view registration/attendance counts.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Director, Advisors, Core Team can create events; creator selects >=1 SPOC from searchable approved member list; free/paid + capacity + UPI/QR; guest management.
  - *Proposed / Pending:* Core Team-created events starting as `Draft` requiring Advisor/Director approval before `Published`; multiple SPOCs with one Primary Lead; event agenda & setup deadlines.
- **Database Dependencies:** New tables: `events`, `event_spocs`, `event_guests`, `event_announcements`.
- **Auth & Authorization:** Create: `core_team`+; Manage event settings/SPOCs/guests: `advisor`+ or assigned `event_spoc`.
- **API / Server Actions:** `POST /api/events`, `PATCH /api/events/[id]`, `POST /api/events/[id]/spocs`, `POST /api/events/[id]/guests`.
- **Main UI Screens:** `/workspace/events/new`, `/workspace/events/[id]` (Overview, SPOCs, Guests, Settings, Registration/Attendance stats).
- **External Integrations:** ImageKit (event poster & paid-event UPI QR image reference).
- **Security Risks:** Client-side SPOC assignment to an unapproved user; exposing private guest contact details on the public event page.
- **Edge Cases:** Removing the last SPOC from an event must be prevented unless an Advisor/Director reassigns one; switching a paid event to free after registrations exist must preserve existing payment records.
- **Acceptance Tests:**
  - Non-SPOC Core Team member cannot edit another SPOC's event.
  - Public `/events/[slug]` excludes internal guest phone/email while showing guest name, title, and LinkedIn link.

---

### Module 5: Operational Teams and Task Assignments
- **Functional Scope:** Inside an event, SPOCs select Event Team members from approved Core Team, assign them to any of the 12 confirmed Operational Teams, view members grouped by operational team with counts, and assign tasks with detailed deliverables (e.g., podium graphics, backdrop dimensions, shot lists, sound checks, anchoring scripts).
- **Confirmed vs. Proposed:**
  - *Confirmed:* 12 operational teams (including Anchoring; excluding the 5 rejected teams); searchable member selection; grouped team view with counts; task assignment to team and/or specific members; detailed deliverables.
  - *Proposed / Pending:* Member serving on multiple operational teams; task workflow (`To do → In progress → Submitted → Approved` / `Changes requested`); **Report a blocker**; cross-team handovers (e.g. Design → AV); reusable event templates.
- **Database Dependencies:** New tables: `operational_teams` (seeded with the 12 confirmed teams), `event_team_members` (`event_id`, `user_id`, `team_code`), `tasks` (`event_id`, `team_code`, `assignee_id`, `status`, `deliverable_spec`, `blocker_note`, `due_at`), `task_comments`.
- **Auth & Authorization:** Assign members/tasks & approve deliverables: `event_spoc` or `advisor`+; update own/team task status & report blockers: assigned `event_team_member`.
- **API / Server Actions:** `POST /api/events/[id]/team`, `POST /api/events/[id]/tasks`, `PATCH /api/tasks/[taskId]`.
- **Main UI Screens:** `/workspace/events/[id]/teams` (grouped by team with counts), `/workspace/events/[id]/tasks` (filterable by team/status/blocker).
- **External Integrations:** Google Drive links attached to task submissions/deliverables.
- **Security Risks:** Assigning unapproved/participant accounts into an Event Team; deleting tasks with audit history.
- **Edge Cases:** Core Team member departs mid-event — tasks remain attributed to their profile and are flagged for SPOC reassignment.
- **Acceptance Tests:**
  - Only the 12 confirmed operational teams exist in `operational_teams`.
  - Task status transitions are validated server-side; non-team members cannot modify tasks.

---

### Module 6: Registrations, Payments and QR Attendance
- **Functional Scope:** Participant registration for free or paid events (enforcing capacity limits), paid-event payment reference/proof submission and verification, unique ticket QR code generation per registration, RD QR scanning to mark attendance, and live attendance sync to Google Sheets.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Free/paid events; fixed/unlimited capacity; UPI ID/QR for paid; unique ticket QR (separate from UPI payment QR); RD scans ticket to mark attendance; live Google Sheets attendance visibility.
  - *Proposed / Pending:* Paid flow (`register → submit proof → verify → issue ticket`); payment verification ownership; `Not checked in` label before closure; attendance correction with recorded reason; Google Wallet pass integration.
- **Database Dependencies:** New tables: `registrations` (`event_id`, `user_id`, `status`, `payment_status`, `payment_ref`, `payment_verified_by`), `tickets` (`registration_id`, `qr_token` signed/unguessable UUID/HMAC), `attendance_logs` (`registration_id`, `checked_in_at`, `checked_in_by`, `correction_reason`).
- **Auth & Authorization:** Register: any authenticated `participant`+; View/verify payments: `event_spoc` / `advisor`+; Scan QR & mark attendance: `RD` team member for that event, `event_spoc`, or `advisor`+.
- **API / Server Actions:** `POST /api/events/[id]/register` (atomic capacity check in SQL transaction/RPC), `POST /api/registrations/[id]/verify-payment`, `POST /api/events/[id]/checkin` (QR scan).
- **Main UI Screens:** Event Registration Modal/Page, `/portal/registrations/[id]` (Ticket QR), `/workspace/events/[id]/registrations`, `/workspace/events/[id]/checkin` (RD QR Scanner).
- **External Integrations:** Google Sheets API (service account or OAuth, explicit sheet sharing per event) for live attendance sync; Google Wallet (pending issuer onboarding).
- **Security Risks:** Race condition overselling capacity; predictable ticket QR tokens allowing forged check-ins; duplicate check-in scans; cross-event QR reuse; exposing payment proofs publicly.
- **Edge Cases:** Scanning a cancelled/unpaid/wrong-event ticket must return a clear rejection reason; concurrent registrations at `capacity - 1` must be serialized via DB transaction/row lock; Google Sheets API failure must NOT block local portal check-in (queue/retry sync).
- **Acceptance Tests:**
  - Concurrent registration requests at capacity limit never exceed `max_capacity`.
  - Scanning a ticket from Event A at Event B's check-in endpoint returns `400 Wrong event`.
  - Duplicate scan returns `409 Already checked in` with original timestamp.

---

### Module 7: Certificates and Exports
- **Functional Scope:** Issue and view participant certificates (including post-closure issuance), and generate downloadable Excel and PDF exports for task allocation lists, participant registration lists, and attendee/attendance lists using user-supplied templates.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Participants view/access issued certificates; Excel & PDF exports for task allocations, registrations, and attendance based on supplied templates; live Google Sheets is separate from downloadable exports; certificate issuance remains possible after event closure.
  - *Proposed / Pending:* Exact certificate design/issuance rules and layout templates (to be supplied by user).
- **Database Dependencies:** `certificates` (`event_id`, `user_id`, `certificate_code`, `issued_at`, `issued_by`, `file_ref`), plus read joins on `events`, `tasks`, `registrations`, `attendance_logs`.
- **Auth & Authorization:** View own certificates: `participant`+; Issue certificates & download exports: `event_spoc` or `advisor`+.
- **API / Server Actions:** `POST /api/events/[id]/certificates/issue`, `GET /api/events/[id]/exports/tasks?format=xlsx|pdf`, `GET /api/events/[id]/exports/registrations?format=xlsx|pdf`, `GET /api/events/[id]/exports/attendance?format=xlsx|pdf`.
- **Main UI Screens:** `/portal/certificates`, `/workspace/events/[id]/certificates`, `/workspace/events/[id]/exports`.
- **External Integrations:** Server-side Excel/PDF generation library (e.g. `exceljs` / `pdf-lib` using templates in `templates/exports/`).
- **Security Risks:** Unauthenticated or Core-Team-without-SPOC access to bulk participant PII exports; CSV/Excel formula injection (`=`, `+`, `-`, `@` prefixes in user-submitted names).
- **Edge Cases:** Escaping leading formula characters in Excel exports; issuing certificates to external participants who don't have enrollment numbers.
- **Acceptance Tests:**
  - Formula-injection payload (`=CMD(...)`) in a user's `full_name` is sanitized/escaped in `.xlsx` export.
  - Non-SPOC Core Team member receives `403` on registration/attendance export endpoints.

---

### Module 8: Event Closure and Permanent Records
- **Functional Scope:** Transition an event through `Closed` and `Archived` states. Closure halts new registrations and check-ins, freezes routine operational editing, preserves a permanent public View Event page (`Event concluded` + approved highlights/social links), retains full internal records for authorized administration, and allows authorized reopening/corrections only with recorded reasons.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Permanent View Event page; public sees overview, date, venue, guests, approved highlights, published social links; admin sees Drive links, report, registrations vs attendees, exports, team allocations; closure stops registrations/check-ins; authorized corrections require recorded reasons; certificates can still be issued; archiving hides from active lists without deleting history.
  - *Proposed / Pending:* Lifecycle (`Draft → Published → Ongoing → Wrap-up → Closed → Archived`) and closure checklist.
- **Database Dependencies:** `events` (`status`, `closed_at`, `closed_by`, `reopen_reason`, `drive_folder_url`, `final_report_url`), `event_highlights` (`is_published`), `audit_log`.
- **Auth & Authorization:** Close/Archive/Reopen: `event_spoc` or `advisor`+ (with mandatory `reason` logged to `audit_log` on reopen/post-close edit).
- **API / Server Actions:** `POST /api/events/[id]/close`, `POST /api/events/[id]/archive`, `POST /api/events/[id]/reopen` (requires reason).
- **Main UI Screens:** `/workspace/events/[id]/closure` (checklist + Close/Archive actions), `/events/[slug]` (concluded public view).
- **External Integrations:** Google Drive links (remain external; website closure does not alter Drive permissions).
- **Security Risks:** Modifying attendance or registrations after closure without an audit log reason; accidentally exposing `drive_folder_url` or `final_report_url` on the public concluded event page.
- **Edge Cases:** Reopening a closed event must require a non-empty reason and write to `audit_log`; archiving must keep `/events/[slug]` accessible by direct URL while removing it from default `/workspace/events` active filters.
- **Acceptance Tests:**
  - `POST /api/events/[id]/register` and `/checkin` return `409 Event is closed` once `status = 'closed'`.
  - Public `/events/[slug]` omits `drive_folder_url` and `final_report_url` when unauthenticated.

---

### Module 9: Administrative Profiles and Promotions
- **Functional Scope:** Complete the remaining UI/integration pieces on top of the existing RBAC schema: ImageKit avatar reference management, public visibility/designation/ordering controls for Director/Advisors, scheduled promotion effective dates and handover workflows, and graduation/departure review.
- **Confirmed vs. Proposed:**
  - *Confirmed:* Existing `profiles`, `org_memberships`, `applications`, `tenure_history`, `audit_log` already built; ImageKit for photos; Director/Advisors manage visibility, designation, ordering; Advisors nominate Core Team, Director approves; promotions can be immediate or scheduled; departing members become Alumni (Alumni Connect eligible) while losing Team Workspace access; old event attributions preserved.
  - *Proposed / Pending:* Scheduled handover cron/date check; Drive ownership handover checklist.
- **Database Dependencies:** `profiles` (add `display_order` integer column in future migration), `org_memberships` (`handover_date` already exists), `tenure_history`, `audit_log`.
- **Auth & Authorization:** Own photo/bio: self; `designation`/`is_public`/`display_order`: `advisor`+ or `director` (with MFA for Director-level overrides); Promotion approval & departure: `director` + `aal2` MFA.
- **API / Server Actions:** `POST /api/media/sign` (ImageKit upload signature), `PATCH /api/admin/profiles/[id]/display` (designation/order/visibility), scheduled promotion activation check.
- **Main UI Screens:** `/account/profile` (extend with ImageKit avatar upload widget), `/account/team` (extend with promotion nomination, scheduled handover date, and Past Teams preview).
- **External Integrations:** ImageKit (server-signed upload; `IMAGEKIT_PRIVATE_KEY` server-only).
- **Security Risks:** Uploading arbitrary non-image files or oversized payloads; member self-promoting via profile edit endpoint.
- **Edge Cases:** Scheduled promotion whose `effective_from` is in the future must not grant `advisor` permissions until that date; departing member with active SPOC assignments triggers a handover warning before final departure.
- **Acceptance Tests:**
  - `profiles` update from a member cannot alter `org_memberships` or `role`.
  - Scheduled membership with `effective_from > current_date` does not elevate `get_user_role()`.

---

### Module 10: Alumni Connect
- **Functional Scope:** Private network exclusively for approved current administration (`director`, `advisor`, `core_team`) and verified E-Cell alumni (`alumni`), with 4 tabs: **Directory** (searchable/filterable with privacy controls), **Startups** (founder showcase), **Opportunities** (internships, roles, co-founder listings), and **Messages** (platform inbox with anti-spam controls & Brevo email notifications).
- **Confirmed vs. Proposed:**
  - *Confirmed:* Appears in navigation only for eligible members; regular participants and unverified college students/external founders are excluded; 4 tabs (`Directory · Startups · Opportunities · Messages`); `Founder`/`Investor`/`Mentor` are optional profile labels, not access-granting roles; alumni retention of Alumni Connect after tenure ends; Brevo for digests/notifications.
  - *Proposed / Pending:* Exact alumni application review criteria & moderation permissions; platform inbox vs connected personal mailbox (recommended initial: platform inbox with Brevo notifications); first-contact request limits, block/mute/report rules, and opt-in digest preferences.
- **Database Dependencies:** `is_alumni_connect_eligible(auth.uid())` (existing); new tables: `alumni_profiles` (privacy flags, city, industry, domain, labels), `startups`, `opportunities`, `conversations`, `conversation_participants`, `messages`, `message_requests`, `user_blocks`, `digest_preferences`.
- **Auth & Authorization:** Strict server + RLS gate using `is_alumni_connect_eligible(auth.uid())` on every read/write/search. Direct messages restricted strictly to `conversation_participants` (Director super-admin role does NOT grant arbitrary private-message browsing; moderation is report-based).
- **API / Server Actions:** `GET /api/alumni/directory` (paginated, privacy-filtered), `POST /api/alumni/startups`, `POST /api/alumni/opportunities`, `POST /api/alumni/messages` (enforces blocklist, rate limits, and first-contact acceptance).
- **Main UI Screens:** `/alumni` (layout with 4 tabs: `/alumni/directory`, `/alumni/startups`, `/alumni/opportunities`, `/alumni/messages`).
- **External Integrations:** Brevo SMTP/API (respecting `digest_preferences` and never leaking private message bodies into digests).
- **Security Risks:** Unapproved participants scraping directory via API; privacy-setting bypass in API responses; unsolicited bulk messaging/spam; Director reading private DMs without a report.
- **Edge Cases:** Suspended alumni immediately lose Alumni Connect access while keeping participant event history; directory queries must enforce server-side pagination (no bulk export); message notifications omit recipient email addresses.
- **Acceptance Tests:**
  - Regular `participant` and `pending` alumni applicant receive `403` on all `/api/alumni/*` endpoints.
  - Directory API omits fields marked private by a member's `alumni_profiles` privacy settings.
  - Blocked user cannot send messages or contact requests; Director cannot query `messages` for conversations they are not a participant in.

---

## 3. Phased Development Roadmap

```
Phase 1: Public Team & Event Core (Modules 1, 4, 9-partial)
   └──► Phase 2: Operational Teams & Tasks (Modules 3, 5)
           └──► Phase 3: Participant Portal, Registration & QR Check-in (Modules 2, 6)
                   └──► Phase 4: Exports, Certificates & Event Closure (Modules 7, 8, 9-complete)
                           └──► Phase 5: Alumni Connect (Module 10)
```

### Phase 1 — Public Website & Event Core
- **Deliverables:** `events`, `event_spocs`, `event_guests`, `contact_inquiries` migrations + RLS; ImageKit server-signing utility; Public `/`, `/events`, `/events/[slug]`, `/about`, `/team` (Current + Past Teams), `/contact`; Event Creation & SPOC assignment UI.
- **Completion Criteria:** Public pages render without auth; `/team` displays only `is_public = true` approved members; Core Team/Advisors/Director can create events and assign SPOCs; `typecheck` and `next build` pass.

### Phase 2 — Team Workspace & Operational Teams
- **Deliverables:** `operational_teams` (12 confirmed teams), `event_team_members`, `tasks`, `task_comments` migrations + RLS; `/workspace` (**My Event Work**); Event Team builder & Task board grouped by operational team.
- **Completion Criteria:** Only the 12 confirmed teams exist; SPOCs can assign approved Core Team members and tasks; non-assigned Core Team members cannot read/edit another event's tasks.

### Phase 3 — Participant Portal, Registrations & QR Check-in
- **Deliverables:** `registrations`, `tickets`, `attendance_logs`, `announcements` migrations + RLS; atomic registration RPC; paid-event proof/verification flow; `/portal` views; RD QR scanner (`/workspace/events/[id]/checkin`); Google Sheets live attendance sync.
- **Completion Criteria:** Capacity limits cannot be exceeded under concurrent requests; unique ticket QR check-in marks attendance and syncs to Google Sheets (gracefully handling Sheets API errors); wrong-event and duplicate scans are rejected.

### Phase 4 — Certificates, Exports, Closure & Profile Completion
- **Deliverables:** `certificates`, `event_highlights` migrations + RLS; `.xlsx`/`.pdf` export endpoints using `templates/exports/`; Event Closure/Archive/Reopen workflows with audit logging; scheduled handover/promotion support and `display_order` on `profiles`.
- **Completion Criteria:** Closed events block new registrations/check-ins and preserve public concluded pages; formula injection in exports is neutralized; certificate issuance works post-closure.

### Phase 5 — Alumni Connect
- **Deliverables:** `alumni_profiles`, `startups`, `opportunities`, `conversations`, `messages`, `user_blocks`, `digest_preferences` migrations + RLS; `/alumni/*` 4-tab interface; Brevo digest/notification integration with anti-spam rate limits.
- **Completion Criteria:** Only approved admin + verified alumni can access `/alumni/*`; directory enforces server-side pagination and privacy flags; messaging enforces blocks, first-contact requests, and participant-only read RLS.
