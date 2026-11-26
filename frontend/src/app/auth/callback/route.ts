import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '../../../lib/supabase/server';
import { returnPath } from '../../../lib/auth/returnPath';

function getRedirectBase(request: Request, origin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${forwardedHost}`;
  }
  return origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = returnPath(searchParams.get('next')) || '/account/reset-password';

  const redirectBase = getRedirectBase(request, origin);
  const supabase = await createClient();

  if (supabase) {
    // 1. Support PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${redirectBase}${next}`);
      }
    }

    // 2. Support token_hash OTP verification (email links and password recovery)
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return NextResponse.redirect(`${redirectBase}${next}`);
      }
    }
  }

  // Return to account page with error flag if verification fails or client is not configured
  return NextResponse.redirect(`${redirectBase}/account?error=auth_callback_failed`);
}
