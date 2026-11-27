import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext } from '@/lib/auth/authorization';
import {
  generateCouponsForRegistration,
  parseEventFoodConfig,
} from '@/lib/events/foodCoupons';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: registrationId } = await params;
  const ctx = await getUserContext();

  if (!ctx) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: reg, error: regErr } = await admin
    .from('registrations')
    .select(`
      id, user_id, event_id, status,
      events(id, title, published_social_links),
      profiles:user_id(full_name)
    `)
    .eq('id', registrationId)
    .single();

  if (regErr || !reg) {
    return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
  }

  // Authorization: user must be registration owner or admin
  if (reg.user_id !== ctx.id && !['director', 'advisor', 'core_team'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const event = Array.isArray(reg.events) ? reg.events[0] : reg.events;
  if (!event) {
    return NextResponse.json({ coupons: [] });
  }

  const foodConfig = parseEventFoodConfig(event);
  if (!foodConfig.enabled) {
    return NextResponse.json({ coupons: [] });
  }

  const participantName = Array.isArray(reg.profiles)
    ? reg.profiles[0]?.full_name
    : (reg.profiles as any)?.full_name || 'Attendee';

  // Fetch redemptions from event_manuals or food_coupons
  const redemptions: Record<string, { redeemed_at: string; redeemed_by?: string }> = {};

  try {
    const { data: dbCoupons } = await admin
      .from('food_coupons')
      .select('qr_token, status, redeemed_at, redeemed_by')
      .eq('registration_id', registrationId)
      .eq('status', 'redeemed');

    if (dbCoupons) {
      for (const c of dbCoupons) {
        if (c.redeemed_at) {
          redemptions[c.qr_token] = { redeemed_at: c.redeemed_at, redeemed_by: c.redeemed_by };
        }
      }
    }
  } catch {}

  try {
    const { data: logs } = await admin
      .from('event_manuals')
      .select('title, created_at, content')
      .eq('event_id', event.id)
      .like('title', `[FOOD_REDEEM]:EDC-COUPON:${event.id}:${registrationId}:%`);

    if (logs) {
      for (const log of logs) {
        const token = log.title.replace('[FOOD_REDEEM]:', '');
        redemptions[token] = { redeemed_at: log.created_at };
      }
    }
  } catch {}

  const coupons = generateCouponsForRegistration({
    eventId: event.id,
    eventTitle: event.title,
    registrationId,
    userId: reg.user_id,
    participantName,
    config: foodConfig,
    redemptions,
  });

  return NextResponse.json({ coupons });
}
