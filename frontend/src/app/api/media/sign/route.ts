import { NextResponse } from 'next/server';
import { getUserContext, requireRole } from '../../../../lib/auth/authorization';
import { createImageKitUploadSignature } from '../../../../lib/media/imagekit';

const ALLOWED_FOLDERS = ['avatars', 'events', 'guests', 'highlights', 'manuals'] as const;

export async function POST(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'participant');
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 401 });
  }

  let body: { folder?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const folder = body.folder ?? 'avatars';
  if (!ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
    return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 });
  }

  if (folder !== 'avatars') {
    const teamErr = requireRole(ctx, 'core_team');
    if (teamErr) {
      return NextResponse.json({ error: teamErr.message }, { status: 403 });
    }
  }

  const sig = createImageKitUploadSignature();
  if (!sig) {
    return NextResponse.json(
      { error: 'ImageKit media uploads are not configured yet.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ...sig,
    folder: `ecell-aitr/${folder}`,
  });
}
