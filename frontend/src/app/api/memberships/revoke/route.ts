import { NextResponse } from 'next/server';
import { revokeMembership } from '../../../../lib/workflows/applications';

export async function POST(request: Request) {
  let body: { targetUserId?: string; newStatus?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { targetUserId, newStatus, reason } = body;
  if (!targetUserId || (newStatus !== 'suspended' && newStatus !== 'departed') || !reason?.trim()) {
    return NextResponse.json(
      { error: 'targetUserId, newStatus (suspended|departed), and reason are required.' },
      { status: 400 }
    );
  }

  const result = await revokeMembership(targetUserId, newStatus, reason.trim());
  if (!result.ok) {
    const status = result.error?.includes('Authentication')
      ? 401
      : result.error?.includes('MFA') || result.error?.includes('requires') || result.error?.includes('own membership')
        ? 403
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
