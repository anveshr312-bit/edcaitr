# Vercel Deployment Guide & Readiness Checklist — E-Cell AITR

This document covers the Vercel deployment configuration, security verification, and manual setup steps for the Next.js + Supabase authentication and RBAC foundation.

---

## 1. Vercel Project Configuration

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (default) |
| **Node.js Runtime** | Serverless / Edge compatible (no permanent Node.js process required) |

### Environment Variables (Configure in Vercel Project Settings → Environment Variables)

| Variable | Scope | Exposure | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Client + Server | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | **Server-Only** | Used only by `createAdminClient()` in `/api/applications/review` and `/api/memberships/revoke` |

> **Security Rule:** Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. Never commit `.env.local` or `backend/.env` to Git.

---

## 2. Manual Deployment Steps

1. **Push your verified commits to GitHub** (when you are ready):
   ```bash
   git push origin main
   ```
2. **Import the repository in Vercel:**
   - Go to [https://vercel.com/new](https://vercel.com/new) and import `anveshr312-bit/edcaitr`.
   - Set **Root Directory** to `frontend`.
   - Confirm **Framework Preset** is `Next.js` and **Build Command** is `npm run build`.
3. **Add Environment Variables** in Vercel before clicking **Deploy**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy** and note your assigned Vercel production URL (referred to below as `<YOUR_VERCEL_URL>`).
5. **Update Supabase Redirect URLs:**
   - Open Supabase Dashboard → **Authentication** → **URL Configuration**.
   - Set **Site URL** to `https://<YOUR_VERCEL_URL>` (when ready for production).
   - Add to **Redirect URLs** (keep localhost entries for local development):
     - `https://<YOUR_VERCEL_URL>/auth/callback`
     - `https://<YOUR_VERCEL_URL>/account`
     - `https://<YOUR_VERCEL_URL>/account/reset-password`
6. **Update Google Cloud OAuth Origins (if using custom domain or direct origin checks):**
   - In Google Cloud Console → **APIs & Services** → **Credentials** → your Web OAuth Client:
   - Add `https://<YOUR_VERCEL_URL>` to **Authorized JavaScript origins**.
   - Keep `https://<project-id>.supabase.co/auth/v1/callback` in **Authorized redirect URIs**.

---

## 3. Security & Architecture Audit Results

| Check | Status | Details |
|---|---|---|
| **Serverless compatibility** | Verified | No permanent Node.js process, no in-memory session store, no custom server. |
| **Git secret hygiene** | Verified | `.gitignore` excludes `.env`, `.env.*`, `.next/`, `node_modules/`. Only `.env.example` templates are tracked. |
| **Dependencies (`npm audit`)** | Verified | `0` vulnerabilities reported in `frontend/`. |
| **Hardcoded URLs / secrets** | Verified | No hardcoded `localhost` or secrets in `frontend/src/`. `auth/callback` supports `x-forwarded-host` for Vercel proxies. |
| **Missing env handling** | Verified | Missing Supabase env vars return safe user-facing messages (`Account services are not configured yet.`) or HTTP `503` without leaking secrets. |
| **Server-side route protection** | Verified | `/account/dashboard`, `/account/applications`, `/account/team` verify `auth.getUser()` and `getUserRole()` on the server; `/api/*` routes enforce `requireRole` / `requireDirectorMfa`. |
| **Zero-privilege signups** | Verified | `handle_new_user()` trigger creates only a `profiles` row; no `org_memberships` row is created on signup. |

---

## 4. Post-Deployment Verification Checklist

Run these checks against `https://<YOUR_VERCEL_URL>` after deploying:

- [ ] `GET https://<YOUR_VERCEL_URL>/api/auth/me` without cookies returns `401 Unauthorized`.
- [ ] `POST https://<YOUR_VERCEL_URL>/api/applications/review` without cookies returns `401 Unauthorized`.
- [ ] `POST https://<YOUR_VERCEL_URL>/api/memberships/revoke` without cookies returns `401 Unauthorized`.
- [ ] Email/password signup creates a `participant` profile only (zero administrative privileges) and sends confirmation email.
- [ ] Google OAuth login redirects through `/auth/callback` and lands signed in on `/account`.
- [ ] Password recovery email redirects to `/auth/callback?next=/account/reset-password` and updates the password.
- [ ] Director account can enroll/verify TOTP at `/account/mfa` and access `/account/applications` and `/account/team`.
- [ ] Non-Director/unauthenticated users visiting `/account/applications` or `/account/team` are redirected away.
