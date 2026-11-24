# E-Cell AITR — functional development

Run from frontend/: npm install, then npm run dev.
Copy frontend/.env.example to frontend/.env.local and fill the Supabase URL and publishable key. Never expose secret/service-role keys in browser variables.
Enable Google in Supabase and allow http://localhost:3000/account as a redirect. Email registration requires custom SMTP and email confirmation. Configure production redirects separately.

Implemented: minimal Next.js landing/account pages, Supabase email signup/sign-in, Google sign-in, sign-out, missing-configuration feedback. Live authentication has not been verified.
Remaining: password recovery, Director MFA enforcement, profiles, role approvals, database access policies, events, tasks, ticketing, exports and Alumni Connect. This is a foundation, not a completed production platform.

Directory guide:
- frontend/src/app: Next.js pages and future server endpoints.
- frontend/src/features and shared: feature code and reusable utilities.
- backend: reserved database migrations and tests; no separate server required.
- assets/source: original assets; templates/exports: supplied export templates.
- docs: project documentation; tools: maintenance; work: disposable local work.

Requirements: ../ecell-website-requirements.md
Accounts: ../accounts-to-create.txt
Checks: npm run build and npm run typecheck from frontend/.
