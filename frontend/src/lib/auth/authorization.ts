import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';
export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'departed';

export interface UserContext {
  id: string;
  email: string | undefined;
  role: AppRole;
  hasMfa: boolean;
}

export interface AuthorizationError {
  code: 'unauthenticated' | 'forbidden' | 'mfa_required' | 'service_unavailable';
  message: string;
}

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthorizationError };

// ---------------------------------------------------------------------------
// Supabase clients
// ---------------------------------------------------------------------------

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** Browser-aware server client using the anon key + cookie session. */
export async function createSessionClient() {
  const cfg = createAnonClient();
  if (!cfg) return null;
  const cookieStore = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component — middleware handles cookie refresh
        }
      },
    },
  });
}

/**
 * Service-role admin client — NEVER exposed to the browser.
 * Only import this in server-only modules.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. This must only be used in server-side code.');
  }
  return createSupabaseAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Session resolution (cached per request)
// ---------------------------------------------------------------------------

/** Resolves the authenticated user for the current request. */
export const getUser = cache(async (): Promise<{ id: string; email: string | undefined } | null> => {
  const client = await createSessionClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
});

/** Resolves the user's highest active administrative role. */
export const getUserRole = cache(async (userId: string): Promise<AppRole> => {
  const client = await createSessionClient();
  if (!client) return 'participant';
  const { data, error } = await client.rpc('get_user_role', { user_uuid: userId });
  if (error || !data) return 'participant';
  return data as AppRole;
});

/** Check whether the current user has completed TOTP/MFA. */
async function hasMfaVerified(): Promise<boolean> {
  const client = await createSessionClient();
  if (!client) return false;
  const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  // nextLevel 'aal2' or currentLevel 'aal2' means MFA was verified this session
  return data?.currentLevel === 'aal2';
}

// ---------------------------------------------------------------------------
// UserContext: full context for the calling user
// ---------------------------------------------------------------------------

export const getUserContext = cache(async (): Promise<UserContext | null> => {
  const user = await getUser();
  if (!user) return null;
  const [role, mfa] = await Promise.all([getUserRole(user.id), hasMfaVerified()]);
  return { id: user.id, email: user.email, role, hasMfa: mfa };
});

// ---------------------------------------------------------------------------
// Authorization gate functions
// ---------------------------------------------------------------------------

function roleRank(role: AppRole): number {
  const ranks: Record<AppRole, number> = {
    director: 4, advisor: 3, core_team: 2, alumni: 1, participant: 0,
  };
  return ranks[role] ?? 0;
}

export function hasRole(ctx: UserContext, minimum: AppRole): boolean {
  return roleRank(ctx.role) >= roleRank(minimum);
}

/** Require a minimum role; returns AuthorizationError if not met. */
export function requireRole(ctx: UserContext | null, minimum: AppRole): AuthorizationError | null {
  if (!ctx) {
    return { code: 'unauthenticated', message: 'Authentication required.' };
  }
  if (!hasRole(ctx, minimum)) {
    return {
      code: 'forbidden',
      message: `This action requires ${minimum} access or above.`,
    };
  }
  return null;
}

/** Director actions additionally require MFA verification this session. */
export function requireDirectorMfa(ctx: UserContext | null): AuthorizationError | null {
  const roleErr = requireRole(ctx, 'director');
  if (roleErr) return roleErr;
  if (!ctx!.hasMfa) {
    return {
      code: 'mfa_required',
      message: 'Director actions require authenticator-app MFA verification for this session.',
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Reusable route handler wrappers
// ---------------------------------------------------------------------------

/** Wraps a Next.js route handler with authentication + minimum role check. */
export function withAuth<T>(
  minimum: AppRole,
  handler: (ctx: UserContext, ...args: unknown[]) => Promise<T>
) {
  return async (...args: unknown[]): Promise<T | Response> => {
    const ctx = await getUserContext();
    const err = requireRole(ctx, minimum);
    if (err) {
      return Response.json({ error: err.message }, {
        status: err.code === 'unauthenticated' ? 401 : 403,
      });
    }
    return handler(ctx!, ...args);
  };
}

/** Wraps a Director-only route handler requiring MFA. */
export function withDirectorMfa<T>(
  handler: (ctx: UserContext, ...args: unknown[]) => Promise<T>
) {
  return async (...args: unknown[]): Promise<T | Response> => {
    const ctx = await getUserContext();
    const err = requireDirectorMfa(ctx);
    if (err) {
      return Response.json({ error: err.message }, {
        status: err.code === 'unauthenticated' ? 401 : err.code === 'mfa_required' ? 403 : 403,
      });
    }
    return handler(ctx!, ...args);
  };
}
