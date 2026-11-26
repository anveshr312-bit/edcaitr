import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Query check-in log for this registration
  const { data: att } = await supabase
    .from('attendance_logs')
    .select('checked_in_at')
    .eq('registration_id', id)
    .maybeSingle();

  return NextResponse.json({
    checked_in: Boolean(att?.checked_in_at),
    checked_in_at: att?.checked_in_at ?? null,
  });
}
