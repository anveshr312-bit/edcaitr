import { NextResponse } from 'next/server';
import { getUserContext, hasRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { redeemFoodCoupon } from '@/lib/events/foodCouponsServer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const ctx = await getUserContext();

  if (!ctx) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Verify permission: creator, primary SPOC, or core team
  const supabase = await createClient();
  let hasAccess = hasRole(ctx, 'core_team');

  if (!hasAccess && supabase) {
    const { data: isSpoc } = await supabase
      .from('event_spocs')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', ctx.id)
      .maybeSingle();

    const { data: isCreator } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('created_by', ctx.id)
      .maybeSingle();

    hasAccess = Boolean(isSpoc || isCreator);
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden: Only designated event coordinators or core team can redeem food coupons.' },
      { status: 403 }
    );
  }

  let body: { qr_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { qr_token } = body;
  if (!qr_token || typeof qr_token !== 'string') {
    return NextResponse.json({ error: 'qr_token is required.' }, { status: 400 });
  }

  const result = await redeemFoodCoupon(eventId, qr_token, ctx.id);

  if (!result.ok) {
    const status = result.error === 'ALREADY_REDEEMED' ? 409 : 400;
    return NextResponse.json(
      {
        error:
          result.error === 'ALREADY_REDEEMED'
            ? `ALREADY REDEEMED: This ${result.meal_title} has already been used for ${result.participant_name}. Repeat meals are blocked.`
            : result.error,
        meal_title: result.meal_title,
        participant_name: result.participant_name,
        redeemed_at: result.redeemed_at,
        is_already_redeemed: result.error === 'ALREADY_REDEEMED',
      },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Meal redeemed successfully: ${result.meal_title} for ${result.participant_name}.`,
    meal_title: result.meal_title,
    participant_name: result.participant_name,
    redeemed_at: result.redeemed_at,
  });
}
