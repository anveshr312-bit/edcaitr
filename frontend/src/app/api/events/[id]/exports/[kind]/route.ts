import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createAdminClient, createSessionClient, getUserContext, requireRole } from '../../../../../../lib/auth/authorization';

export function sanitizeSpreadsheetCell(value: unknown): string {
  const str = String(value ?? '').trim();
  if (!str) return '';
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; kind: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { id: eventId, kind } = await context.params;
  const format = new URL(request.url).searchParams.get('format') === 'pdf' ? 'pdf' : 'xlsx';

  if (!['tasks', 'registrations', 'attendance'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid export type.' }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  if (!sessionClient) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data: canManage } = await sessionClient.rpc('can_manage_event', {
    p_event_id: eventId,
    p_user_id: ctx!.id,
  });
  if (!canManage) {
    return NextResponse.json({ error: 'Only Event Leads (SPOCs) or Advisors can export event data.' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('title, slug').eq('id', eventId).single();
  const eventTitle = event?.title ?? 'EDC AITR Event';

  let headers: string[] = [];
  let rows: string[][] = [];

  if (kind === 'tasks') {
    headers = ['Team', 'Task Title', 'Status', 'Assignee', 'Deliverable Spec', 'Due Date'];
    const { data } = await admin
      .from('tasks')
      .select('team_code, title, status, deliverable_spec, due_at, profiles!assignee_id(full_name)')
      .eq('event_id', eventId)
      .order('team_code');

    rows = (data ?? []).map((t) => {
      const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
      return [
        sanitizeSpreadsheetCell(t.team_code),
        sanitizeSpreadsheetCell(t.title),
        sanitizeSpreadsheetCell(t.status),
        sanitizeSpreadsheetCell(p?.full_name ?? 'Team'),
        sanitizeSpreadsheetCell(t.deliverable_spec ?? ''),
        sanitizeSpreadsheetCell(t.due_at ? new Date(t.due_at).toLocaleDateString('en-IN') : ''),
      ];
    });
  } else if (kind === 'registrations') {
    headers = ['Name', 'Category', 'Organization', 'Status', 'Payment Status', 'Payment Ref'];
    const { data } = await admin
      .from('registrations')
      .select('participant_category, organization, status, payment_status, payment_ref, profiles!user_id(full_name, college)')
      .eq('event_id', eventId)
      .order('created_at');

    rows = (data ?? []).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return [
        sanitizeSpreadsheetCell(p?.full_name ?? 'Participant'),
        sanitizeSpreadsheetCell(r.participant_category),
        sanitizeSpreadsheetCell(r.organization ?? p?.college ?? ''),
        sanitizeSpreadsheetCell(r.status),
        sanitizeSpreadsheetCell(r.payment_status),
        sanitizeSpreadsheetCell(r.payment_ref ?? ''),
      ];
    });
  } else {
    headers = ['Ticket Code', 'Name', 'Category', 'Organization', 'Attendance Status', 'Checked-in At'];
    const { data } = await admin
      .from('registrations')
      .select('participant_category, organization, profiles!user_id(full_name, college), tickets(ticket_code), attendance_logs(checked_in_at)')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')
      .order('created_at');

    rows = (data ?? []).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const t = Array.isArray(r.tickets) ? r.tickets[0] : r.tickets;
      const a = Array.isArray(r.attendance_logs) ? r.attendance_logs[0] : r.attendance_logs;
      return [
        sanitizeSpreadsheetCell(t?.ticket_code ?? ''),
        sanitizeSpreadsheetCell(p?.full_name ?? 'Participant'),
        sanitizeSpreadsheetCell(r.participant_category),
        sanitizeSpreadsheetCell(r.organization ?? p?.college ?? ''),
        sanitizeSpreadsheetCell(a ? 'Checked in' : 'Not checked in'),
        sanitizeSpreadsheetCell(a?.checked_in_at ? new Date(a.checked_in_at).toLocaleString('en-IN') : ''),
      ];
    });
  }

  const filenameBase = `${event?.slug || 'event'}-${kind}`;

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(kind.toUpperCase());
    sheet.addRow([`EDC AITR — ${eventTitle} (${kind.toUpperCase()})`]);
    sheet.addRow([]);
    sheet.addRow(headers);
    for (const row of rows) sheet.addRow(row);
    sheet.getRow(3).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage([842, 595]); // A4 landscape
  let y = 550;

  page.drawText(`EDC AITR — ${eventTitle} (${kind.toUpperCase()})`, {
    x: 40,
    y,
    size: 14,
    font: bold,
    color: rgb(0.07, 0.07, 0.09),
  });
  y -= 28;
  page.drawText(headers.join(' | '), { x: 40, y, size: 10, font: bold });
  y -= 18;

  for (const row of rows) {
    if (y < 40) {
      page = pdfDoc.addPage([842, 595]);
      y = 550;
    }
    page.drawText(row.join(' | ').slice(0, 130), { x: 40, y, size: 9, font });
    y -= 15;
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
    },
  });
}
