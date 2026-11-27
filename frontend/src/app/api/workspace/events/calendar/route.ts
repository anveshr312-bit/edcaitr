import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

const VALID_STAGES = [
  'concept',
  'speaker_curation',
  'permissions_venue',
  'marketing_ready',
  'live_ready',
  'concluded',
  'cancelled',
] as const;

/**
 * GET /api/workspace/events/calendar
 * Returns all events with planning stages, readiness progress, and dates.
 * Accessible to all workspace roles (core_team all domains, advisor, director).
 */
export async function GET() {
  try {
    const ctx = await getUserContext();
    const roleErr = requireRole(ctx, 'core_team');
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from('events')
      .select(`
        id, title, slug, starts_at, ends_at, venue, status,
        is_paid, fee_amount, max_capacity,
        planning_progress, planning_stage, cancellation_reason,
        created_at
      `)
      .order('starts_at', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch calendar events.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/workspace/events/calendar
 * Allows Programs & Experiences coordinators, Advisors, and Director to schedule upcoming events.
 */
export async function POST(request: Request) {
  try {
    const ctx = await getUserContext();
    const roleErr = requireRole(ctx, 'core_team');
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 403 });
    }

    const admin = createAdminClient();

    // Check if user is Programs & Experiences, Advisor, or Director
    if (ctx!.role === 'core_team') {
      const { data: profile } = await admin
        .from('profiles')
        .select('domain')
        .eq('id', ctx!.id)
        .maybeSingle();

      if (profile?.domain !== 'programs_experiences') {
        return NextResponse.json(
          {
            error:
              'Event Calendar scheduling is managed by the Programs & Experiences domain, Advisors, and Directorate.',
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      title,
      slug,
      summary,
      starts_at,
      ends_at,
      venue,
      planning_stage = 'concept',
      planning_progress = 10,
      is_paid = false,
      fee_amount = null,
      max_capacity = null,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Event title is required.' }, { status: 400 });
    }

    const generatedSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString(36);

    const { data: newEvent, error: insertErr } = await admin
      .from('events')
      .insert({
        title: title.trim(),
        slug: generatedSlug,
        summary: summary?.trim() || null,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
        venue: venue?.trim() || 'AITR Main Auditorium, Indore',
        status: 'draft',
        planning_stage,
        planning_progress: Math.min(100, Math.max(0, Number(planning_progress) || 0)),
        is_paid: Boolean(is_paid),
        fee_amount: fee_amount ? Number(fee_amount) : null,
        max_capacity: max_capacity ? Number(max_capacity) : null,
        created_by: ctx!.id,
      })
      .select('id, title, slug, starts_at, planning_stage, planning_progress')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Insert audit log
    await admin.from('audit_log').insert({
      actor_id: ctx!.id,
      event: 'calendar_event_created',
      target_id: newEvent.id,
      target_type: 'event',
      detail: {
        title: newEvent.title,
        planning_stage,
        planning_progress,
      },
    });

    return NextResponse.json({ ok: true, event: newEvent }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to schedule calendar event.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/workspace/events/calendar
 * Update planning readiness, stage, or record transparent cancellation.
 */
export async function PATCH(request: Request) {
  try {
    const ctx = await getUserContext();
    const roleErr = requireRole(ctx, 'core_team');
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 403 });
    }

    const admin = createAdminClient();

    // Check domain permissions
    if (ctx!.role === 'core_team') {
      const { data: profile } = await admin
        .from('profiles')
        .select('domain')
        .eq('id', ctx!.id)
        .maybeSingle();

      if (profile?.domain !== 'programs_experiences') {
        return NextResponse.json(
          {
            error:
              'Event Calendar progress updates are restricted to Programs & Experiences coordinators, Advisors, and Directorate.',
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { event_id, planning_progress, planning_stage, cancellation_reason, status } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (planning_progress !== undefined) {
      updatePayload.planning_progress = Math.min(100, Math.max(0, Number(planning_progress)));
    }

    if (planning_stage) {
      if (!VALID_STAGES.includes(planning_stage)) {
        return NextResponse.json({ error: 'Invalid planning_stage.' }, { status: 400 });
      }
      updatePayload.planning_stage = planning_stage;

      if (planning_stage === 'cancelled') {
        updatePayload.status = 'cancelled';
        if (cancellation_reason?.trim()) {
          updatePayload.cancellation_reason = cancellation_reason.trim();
        }
      }
    }

    if (cancellation_reason !== undefined) {
      updatePayload.cancellation_reason = cancellation_reason?.trim() || null;
    }

    if (status) {
      updatePayload.status = status;
    }

    const { data: updated, error: updateErr } = await admin
      .from('events')
      .update(updatePayload)
      .eq('id', event_id)
      .select('id, slug, title, status, planning_stage, planning_progress, cancellation_reason')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // If event is cancelled, notify users who set reminders
    if (updatePayload.status === 'cancelled' || updatePayload.planning_stage === 'cancelled') {
      try {
        const { data: reminders } = await admin
          .from('event_reminders')
          .select('user_id')
          .eq('event_id', event_id);

        if (reminders && reminders.length > 0) {
          const notificationRows = reminders.map((r) => ({
            recipient_id: r.user_id,
            actor_id: ctx!.id,
            title: `Event Notice: ${updated.title} Cancelled / Rescheduled`,
            body:
              updated.cancellation_reason ||
              `The event "${updated.title}" has been cancelled or rescheduled by the Programs & Experiences team.`,
            link_url: `/events/${updated.slug || updated.id}`,
            notification_type: 'event_cancelled',
          }));

          await admin.from('notifications').insert(notificationRows);
        }
      } catch (notifyErr) {
        console.warn('Could not dispatch reminder notifications:', notifyErr);
      }
    }

    // Insert audit log
    await admin.from('audit_log').insert({
      actor_id: ctx!.id,
      event: 'calendar_event_updated',
      target_id: event_id,
      target_type: 'event',
      detail: updatePayload,
    });

    return NextResponse.json({ ok: true, event: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update calendar event.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
