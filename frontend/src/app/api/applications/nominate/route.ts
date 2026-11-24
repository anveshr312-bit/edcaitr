import { NextResponse } from 'next/server';
import { nominateForPromotion } from '../../../../lib/workflows/applications';

export async function POST(request: Request) {
  let body: { nomineeId?: string; statement?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.nomineeId || !body.statement?.trim() || body.statement.trim().length < 20) {
    return NextResponse.json(
      { error: 'nomineeId and a supporting statement (minimum 20 characters) are required.' },
      { status: 400 }
    );
  }

  const result = await nominateForPromotion(body.nomineeId, body.statement);
  if (!result.ok) {
    const status = result.error?.includes('Authentication')
      ? 401
      : result.error?.includes('requires') || result.error?.includes('yourself')
        ? 403
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
