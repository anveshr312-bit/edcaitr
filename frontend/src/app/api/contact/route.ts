import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  const subject = body.subject?.trim() ?? '';
  const message = body.message?.trim() ?? '';

  if (name.length < 2 || !email.includes('@') || subject.length < 3 || message.length < 10) {
    return NextResponse.json(
      { error: 'Please provide a valid name, email, subject, and message (min 10 characters).' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const { error } = await supabase.from('contact_inquiries').insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    return NextResponse.json({ error: 'Unable to submit inquiry right now.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
