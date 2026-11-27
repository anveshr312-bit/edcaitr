import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../lib/auth/authorization';
import { encodeEventFoodConfig, type EventFoodConfig } from '../../../lib/events/foodCoupons';

export async function POST(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: {
    title?: string;
    slug?: string;
    summary?: string;
    description?: string;
    venue?: string;
    starts_at?: string;
    ends_at?: string;
    status?: string;
    is_paid?: boolean;
    fee_amount?: number | null;
    upi_id?: string;
    upi_qr_ref?: string;
    poster_ref?: string;
    max_capacity?: number | null;
    spoc_ids?: string[];
    food_coupon_config?: EventFoodConfig;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = body.title?.trim() ?? '';
  const slug = (body.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const spocIds = Array.isArray(body.spoc_ids) && body.spoc_ids.length > 0 ? body.spoc_ids : [ctx!.id];

  if (!title || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: 'Valid event title and URL slug (lowercase alphanumeric and hyphens) are required.' },
      { status: 400 }
    );
  }

  if (body.is_paid && (!body.fee_amount || Number(body.fee_amount) <= 0)) {
    return NextResponse.json(
      { error: 'Paid events require a positive fee amount.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: eventId, error } = await admin.rpc('create_event_with_spoc', {
    p_slug: slug,
    p_title: title,
    p_summary: body.summary ?? '',
    p_description: body.description ?? '',
    p_venue: body.venue ?? '',
    p_starts_at: body.starts_at || null,
    p_ends_at: body.ends_at || null,
    p_status: body.status === 'published' ? 'published' : 'draft',
    p_is_paid: Boolean(body.is_paid),
    p_fee_amount: body.is_paid ? Number(body.fee_amount) : null,
    p_upi_id: body.upi_id ?? '',
    p_upi_qr_ref: body.upi_qr_ref ?? '',
    p_poster_ref: body.poster_ref ?? '',
    p_max_capacity: body.max_capacity ? Number(body.max_capacity) : null,
    p_spoc_ids: spocIds,
    p_creator_id: ctx!.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (body.food_coupon_config && eventId) {
    try {
      const encoded = encodeEventFoodConfig(body.food_coupon_config, []);
      await admin.from('events').update({ published_social_links: encoded }).eq('id', eventId);
    } catch (saveErr) {
      console.warn('Failed to save food coupon config:', saveErr);
    }
  }

  return NextResponse.json({ ok: true, id: eventId, slug });
}
