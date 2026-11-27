import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getUserRole } from '../../../../lib/auth/authorization';

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Authentication service not configured' },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Authentication required.' },
      { status: 401 }
    );
  }

  const [role, { data: profile }] = await Promise.all([
    getUserRole(user.id),
    supabase
      .from('profiles')
      .select('full_name, avatar_ref, designation, college, bio, linkedin_url, domain')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    role: role ?? 'participant',
    profile: profile ?? null,
  });
}
