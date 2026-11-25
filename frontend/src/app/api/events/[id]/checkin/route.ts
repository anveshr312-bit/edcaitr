import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';
import { syncAttendanceToGoogleSheet } from '../../../../../lib/integrations/googleSheets';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { id: eventId } = await context.params;
  let body: { qr_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const rawToken = body.qr_token?.trim() ?? '';
  if (!UUID_RE.test(rawToken)) {
    return NextResponse.json({ error: 'Invalid QR token format.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('checkin_by_qr', {
    p_event_id: eventId,
    p_qr_token: rawToken,
    p_scanner_id: ctx!.id,
  });

  if (error) {
    const status = error.message.includes('Only Registration')
      ? 403
      : error.message.includes('closed')
        ? 409
        : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (data?.already_checked_in) {
    return NextResponse.json(
      {
        error: `Already checked in at ${new Date(data.checked_in_at).toLocaleTimeString('en-IN')}.`,
        already_checked_in: true,
        ...data,
      },
      { status: 409 }
    );
  }

  const sheetSync = await syncAttendanceToGoogleSheet({
    attendanceId: data.attendance_id,
    sheetId: data.google_sheet_id,
    ticketCode: data.ticket_code,
    participantName: data.participant_name,
    category: data.participant_category,
    organization: data.organization,
    checkedInAt: data.checked_in_at,
  });

  return NextResponse.json({
    ok: true,
    ...data,
    sheets_synced: sheetSync.synced,
    sheets_note: sheetSync.reason ?? null,
  });
}
