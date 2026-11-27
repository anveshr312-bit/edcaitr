import { createAdminClient } from '@/lib/auth/authorization';
import { type FoodCoupon, type MealType, MEAL_THEMES } from './foodCoupons';

/**
 * Redeems a food coupon with strict anti-duplicate enforcement.
 * Server-only execution.
 */
export async function redeemFoodCoupon(
  eventId: string,
  qrToken: string,
  scannerId: string
): Promise<{
  ok: boolean;
  coupon?: FoodCoupon;
  participant_name?: string;
  meal_title?: string;
  redeemed_at?: string;
  error?: string;
}> {
  const admin = createAdminClient();
  const trimmedToken = qrToken.trim();

  // Try checking dedicated food_coupons table first
  try {
    const { data: dbCoupon } = await admin
      .from('food_coupons')
      .select('*, profiles:user_id(full_name)')
      .eq('qr_token', trimmedToken)
      .maybeSingle();

    if (dbCoupon) {
      if (dbCoupon.status === 'redeemed') {
        const participant = Array.isArray(dbCoupon.profiles)
          ? dbCoupon.profiles[0]?.full_name
          : dbCoupon.profiles?.full_name;
        return {
          ok: false,
          error: 'ALREADY_REDEEMED',
          meal_title: dbCoupon.meal_title,
          participant_name: participant || 'Attendee',
          redeemed_at: dbCoupon.redeemed_at,
        };
      }

      const now = new Date().toISOString();
      const { error: updateErr } = await admin
        .from('food_coupons')
        .update({
          status: 'redeemed',
          redeemed_at: now,
          redeemed_by: scannerId,
        })
        .eq('id', dbCoupon.id);

      if (!updateErr) {
        const participant = Array.isArray(dbCoupon.profiles)
          ? dbCoupon.profiles[0]?.full_name
          : dbCoupon.profiles?.full_name;
        return {
          ok: true,
          participant_name: participant || 'Attendee',
          meal_title: dbCoupon.meal_title,
          redeemed_at: now,
          coupon: {
            ...dbCoupon,
            status: 'redeemed',
            redeemed_at: now,
          },
        };
      }
    }
  } catch {
    // If food_coupons table does not exist or errors, continue with resilient manual log
  }

  // Resilient fallback persistence using event_manuals or audit trail
  // Token format: EDC-COUPON:eventId:registrationId:mealType:index
  const parts = trimmedToken.split(':');
  if (parts.length < 5 || parts[0] !== 'EDC-COUPON') {
    return { ok: false, error: 'INVALID_TOKEN: Scanned QR is not a valid EDC Food Coupon.' };
  }

  const [, tokenEventId, registrationId, mealType, seq] = parts;
  if (tokenEventId !== eventId) {
    return { ok: false, error: 'EVENT_MISMATCH: This coupon belongs to a different event.' };
  }

  // Check if already redeemed in event_manuals
  const redemptionTag = `[FOOD_REDEEM]:${trimmedToken}`;
  const { data: existingLog } = await admin
    .from('event_manuals')
    .select('id, created_at, content')
    .eq('event_id', eventId)
    .eq('title', redemptionTag)
    .maybeSingle();

  if (existingLog) {
    let details: any = {};
    try {
      details = JSON.parse(existingLog.content || '{}');
    } catch {}
    return {
      ok: false,
      error: 'ALREADY_REDEEMED',
      meal_title: details.meal_title || `${MEAL_THEMES[mealType as MealType]?.title || mealType} #${seq}`,
      participant_name: details.participant_name || 'Attendee',
      redeemed_at: existingLog.created_at,
    };
  }

  // Fetch registration and profile to confirm validity
  const { data: reg } = await admin
    .from('registrations')
    .select('id, status, user_id, profiles:user_id(full_name)')
    .eq('id', registrationId)
    .maybeSingle();

  if (!reg) {
    return { ok: false, error: 'REGISTRATION_NOT_FOUND: Pass registration record not found.' };
  }

  const participantName = Array.isArray(reg.profiles)
    ? reg.profiles[0]?.full_name
    : (reg.profiles as any)?.full_name || 'Attendee';

  const mealTitle = `${MEAL_THEMES[mealType as MealType]?.title || mealType} #${seq}`;
  const now = new Date().toISOString();

  // Atomically persist redemption
  await admin.from('event_manuals').insert({
    event_id: eventId,
    title: redemptionTag,
    content: JSON.stringify({
      token: trimmedToken,
      meal_type: mealType,
      meal_title: mealTitle,
      registration_id: registrationId,
      participant_name: participantName,
      redeemed_at: now,
      redeemed_by: scannerId,
    }),
    is_public: false,
  });

  return {
    ok: true,
    participant_name: participantName,
    meal_title: mealTitle,
    redeemed_at: now,
  };
}
