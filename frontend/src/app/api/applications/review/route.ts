import { NextResponse } from 'next/server';
import { approvePromotion, reviewApplication } from '../../../../lib/workflows/applications';

export async function POST(request: Request) {
  let body: { applicationId?: string; applicationType?: string; decision?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { applicationId, applicationType, decision, note } = body;
  if (!applicationId || (decision !== 'approved' && decision !== 'rejected') || !note?.trim()) {
    return NextResponse.json(
      { error: 'applicationId, valid decision (approved|rejected), and note are required.' },
      { status: 400 }
    );
  }

  const result =
    applicationType === 'promotion_nomination'
      ? await approvePromotion(applicationId, decision, note)
      : await reviewApplication(applicationId, decision, note);

  if (!result.ok) {
    const status = result.error?.includes('Authentication')
      ? 401
      : result.error?.includes('MFA') || result.error?.includes('requires') || result.error?.includes('only review') || result.error?.includes('own application')
        ? 403
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
