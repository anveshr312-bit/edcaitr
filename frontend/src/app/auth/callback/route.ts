import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

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
  let next = searchParams.get('next') ?? '/account';

  // Prevent open redirects: ensure `next` is a relative URL starting with '/' and not '//'
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/account';
  }

  const redirectBase = getRedirectBase(request, origin);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${redirectBase}${next}`);
      }
    }
  }

  // Return to account page with error flag if code exchange fails or client is not configured
  return NextResponse.redirect(`${redirectBase}/account?error=auth_callback_failed`);
}
