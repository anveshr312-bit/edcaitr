# Supabase and Google OAuth Setup Guide

This document describes the manual setup required in the Supabase Dashboard and Google Cloud Console to complete the authentication foundation for E-Cell AITR.

---

## 1. Supabase Project Credentials

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or create a new project).
3. Navigate to **Project Settings** > **API** (or **Data API**).
4. Locate:
   - **Project URL**: matches `NEXT_PUBLIC_SUPABASE_URL`.
   - **anon / public key**: matches `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. In your local development environment:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
6. Add the Project URL and anon key into `frontend/.env.local`.
   > **Security Note:** Never place the `service_role` secret or database passwords in `frontend/.env.local` or client-exposed variables.

---

## 2. Authentication: URL Configuration & Redirects

1. In Supabase Dashboard, navigate to **Authentication** > **URL Configuration**.
2. Set **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-production-domain.com`
3. In **Redirect URLs**, add the allowed redirect callbacks:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/account`
   - `http://localhost:3000/account/reset-password`
   - `https://your-production-domain.com/auth/callback`
   - `https://your-production-domain.com/account`
   - `https://your-production-domain.com/account/reset-password`

---

## 3. Email Authentication & Custom SMTP

1. In Supabase Dashboard, go to **Authentication** > **Providers** > **Email**.
2. Ensure **Enable Email provider** is turned on.
3. Keep **Confirm email** enabled for real account verification.
4. Go to **Project Settings** > **Authentication** > **SMTP Settings**:
   - Enable **Custom SMTP** to send emails via Brevo (or your designated transactional email provider).
   - Host: `smtp-relay.brevo.com` (or provider host)
   - Port: `587`
   - Username: your Brevo SMTP login
   - Password: your Brevo SMTP key
   - Sender Email: verified domain sender address (e.g. `noreply@ecell-aitr.ac.in` or approved sender)
   - Sender Name: `E-Cell AITR`

---

## 4. Google OAuth Configuration

### A. Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud project (e.g., `ecell-aitr`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Select User Type: **External** (unless strictly restricted to college Google Workspace users).
   - App Name: `E-Cell AITR`
   - User Support Email: your official contact email.
   - Authorized Domains: add `supabase.co` and your project domain.
   - Developer Contact Info: your administrator email.
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `E-Cell AITR Web Auth`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://<your-supabase-project-id>.supabase.co`
     - `https://your-production-domain.com`
   - **Authorized redirect URIs**:
     - In Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
     - Copy the **Callback URL (for OAuth)** (format: `https://<project-id>.supabase.co/auth/v1/callback`).
     - Paste this URL into Google Cloud's **Authorized redirect URIs**.
5. Save and copy the generated **Client ID** and **Client Secret**.

### B. Supabase Dashboard
1. In Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
2. Toggle **Enable Google provider**.
3. Paste:
   - **Client ID** (from Google Cloud)
   - **Client Secret** (from Google Cloud)
4. Click **Save**.

---

## 5. Verification Checklist

- [ ] `.env.local` created with valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Sign up with email/password: receives confirmation email, confirmation link redirects to `/auth/callback` and signs user in.
- [ ] Sign in with email/password: session persists across page reloads.
- [ ] Forgot password: reset email received, clicking link navigates to `/account/reset-password`, allowing password update.
- [ ] Continue with Google: redirects to Google sign-in consent screen, returns through callback, creates or links account.
- [ ] Protected endpoints (`/api/auth/me`) return `401 Unauthorized` without session cookies and `200 OK` with user details when authenticated.
