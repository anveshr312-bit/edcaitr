import { NextResponse } from 'next/server';
import { approvePromotion, reviewApplication } from '../../../../lib/workflows/applications';

export async function POST(request: Request) {
  try {
    let body: { applicationId?: string; applicationType?: string; decision?: string; note?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body in review request.' }, { status: 400 });
    }

    const { applicationId, applicationType, decision, note } = body;
    if (!applicationId || (decision !== 'approved' && decision !== 'rejected') || !note?.trim()) {
      return NextResponse.json(
        { error: 'applicationId, valid decision (approved|rejected), and governance note are required.' },
        { status: 400 }
      );
    }

    const result =
      applicationType === 'promotion_nomination'
        ? await approvePromotion(applicationId, decision, note)
        : await reviewApplication(applicationId, decision, note);

    if (!result.ok) {
      const errorMsg = result.error || 'Failed to review application.';
      const status = errorMsg.includes('Authentication')
        ? 401
        : errorMsg.includes('MFA') || errorMsg.includes('requires') || errorMsg.includes('only review') || errorMsg.includes('own application')
          ? 403
          : 400;
      return NextResponse.json({ error: errorMsg }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Unhandled error in POST /api/applications/review:', err);
    const message = err instanceof Error ? err.message : 'Internal server error processing review.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
