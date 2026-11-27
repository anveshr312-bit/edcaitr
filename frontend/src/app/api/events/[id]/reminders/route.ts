import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { createAdminClient } from '../../../../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ hasReminder: false, count: 0 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const [{ count }, userReminder] = await Promise.all([
      admin
        .from('event_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id),
      user
        ? admin
            .from('event_reminders')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      hasReminder: Boolean(userReminder.data),
      count: count ?? 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({ hasReminder: false, count: 0 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to set a reminder.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check if reminder already exists
    const { data: existing } = await admin
      .from('event_reminders')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Toggle off
      await admin.from('event_reminders').delete().eq('id', existing.id);
      return NextResponse.json({ ok: true, hasReminder: false, action: 'removed' });
    } else {
      // Toggle on
      await admin.from('event_reminders').insert({
        event_id: id,
        user_id: user.id,
      });
      return NextResponse.json({ ok: true, hasReminder: true, action: 'added' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update reminder.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
