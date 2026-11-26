import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { sendApplicationReceivedEmail } from '../../../lib/applications/email';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch role and applications in parallel
  const [roleRes, appsRes] = await Promise.all([
    supabase.rpc('get_user_role', { user_uuid: user.id }),
    supabase
      .from('applications')
      .select('id, application_type, status, statement, created_at, reviewed_at, review_note')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    role: roleRes.data || 'participant',
    applications: appsRes.data || [],
  });
}

export async function POST(request: Request) {
  let body: { applicationType?: string; statement?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload in request.' }, { status: 400 });
  }

  const { applicationType, statement } = body;
  const cleanStatement = statement?.trim() || '';

  if (!applicationType) {
    return NextResponse.json({ error: 'Please select a role to apply for.' }, { status: 400 });
  }

  const validTypes = ['core_team_application', 'advisor_application', 'alumni_verification'];
  if (!validTypes.includes(applicationType)) {
    return NextResponse.json({ error: 'Invalid application role selected.' }, { status: 400 });
  }

  if (cleanStatement.length < 20) {
    return NextResponse.json(
      { error: 'Your supporting statement must be at least 20 characters long.' },
      { status: 400 }
    );
  }

  if (cleanStatement.length > 2000) {
    return NextResponse.json(
      { error: 'Your supporting statement exceeds the maximum 2,000 character limit.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to submit an application.' },
      { status: 401 }
    );
  }

  // 1. Safeguard: Ensure profile row exists in public.profiles to satisfy Foreign Key
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const defaultName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: defaultName }, { onConflict: 'id' });

    if (profileErr) {
      console.warn('Profile bootstrap note:', profileErr.message);
    }
  }

  // 2. Safeguard: Check if an unreviewed (pending) application already exists
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id, status, created_at')
    .eq('applicant_id', user.id)
    .eq('application_type', applicationType)
    .is('reviewed_at', null)
    .maybeSingle();

  if (existingApp) {
    return NextResponse.json(
      {
        error:
          'You already have a pending application for this role. Our leadership will review your active submission shortly.',
      },
      { status: 409 }
    );
  }

  // 3. Insert into applications
  const { data: newApp, error: insertErr } = await supabase
    .from('applications')
    .insert({
      applicant_id: user.id,
      application_type: applicationType,
      statement: cleanStatement,
      status: 'pending',
    })
    .select('id, application_type, status, created_at, review_note')
    .single();

  if (insertErr) {
    console.error('Error inserting application:', insertErr);
    // Provide user-friendly translations for DB error codes
    let msg = insertErr.message || 'Failed to submit application.';
    if (insertErr.code === '23505') {
      msg = 'You already have a pending application of this type.';
    } else if (insertErr.code === '42501') {
      msg = 'Permission denied by governance policies. Please verify your account status.';
    } else if (insertErr.code === '23503') {
      msg = 'Your profile record is not yet initialized in the database. Please visit Edit Profile (/account/profile) to save your name first, or apply Migration 015 in Supabase.';
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (user.email) {
      const applicantName: string = profile?.full_name || user.user_metadata?.full_name || 'Applicant';
      void sendApplicationReceivedEmail({
        recipientEmail: user.email,
        recipientName: applicantName,
        applicationType,
        statement: cleanStatement,
        applicationId: newApp.id,
      }).catch((e) => console.warn('Receipt email dispatch error:', e));
    }
  } catch (emailErr) {
    console.warn('Could not dispatch receipt email:', emailErr);
  }

  return NextResponse.json({
    ok: true,
    message: 'Application submitted successfully. You will be notified of the governance decision.',
    application: newApp,
  });
}
