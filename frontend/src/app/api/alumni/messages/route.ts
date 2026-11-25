import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../lib/auth/authorization';

export async function POST(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'alumni');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: { recipient_id?: string; conversation_id?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body.body?.trim() ?? '';
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: 'Message body must be 1–2000 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();
  let convId = body.conversation_id;
  let recipientId = body.recipient_id;

  if (convId) {
    const { data: conv } = await admin
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .maybeSingle();

    if (!conv || (conv.initiator_id !== ctx!.id && conv.recipient_id !== ctx!.id)) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    recipientId = conv.initiator_id === ctx!.id ? conv.recipient_id : conv.initiator_id;

    if (conv.request_status === 'declined') {
      return NextResponse.json({ error: 'This contact request was declined.' }, { status: 403 });
    }
    if (conv.request_status === 'pending' && conv.initiator_id === ctx!.id) {
      return NextResponse.json(
        { error: 'Wait for the recipient to accept your contact request before sending another message.' },
        { status: 429 }
      );
    }
  } else if (recipientId) {
    if (recipientId === ctx!.id) {
      return NextResponse.json({ error: 'Cannot message yourself.' }, { status: 400 });
    }

    // Check blocks in both directions
    const { data: block } = await admin
      .from('user_blocks')
      .select('blocker_id')
      .or(`and(blocker_id.eq.${ctx!.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${ctx!.id})`)
      .limit(1);

    if (block && block.length > 0) {
      return NextResponse.json({ error: 'Messaging is blocked between these accounts.' }, { status: 403 });
    }

    // Check recipient eligibility & allow_messages preference
    const { data: recRole } = await admin.rpc('get_user_role', { user_uuid: recipientId });
    if (!['director', 'advisor', 'core_team', 'alumni'].includes(String(recRole))) {
      return NextResponse.json({ error: 'Recipient is not an Alumni Connect member.' }, { status: 403 });
    }

    const { data: ap } = await admin
      .from('alumni_profiles')
      .select('allow_messages')
      .eq('user_id', recipientId)
      .maybeSingle();
    if (ap && ap.allow_messages === false) {
      return NextResponse.json({ error: 'Recipient has disabled incoming messages.' }, { status: 403 });
    }

    // Check existing conversation
    const { data: existing } = await admin
      .from('conversations')
      .select('id, request_status, initiator_id')
      .or(`and(initiator_id.eq.${ctx!.id},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${ctx!.id})`)
      .maybeSingle();

    if (existing) {
      convId = existing.id;
      if (existing.request_status === 'declined') {
        return NextResponse.json({ error: 'Contact request was declined.' }, { status: 403 });
      }
      if (existing.request_status === 'pending' && existing.initiator_id === ctx!.id) {
        return NextResponse.json(
          { error: 'Contact request is still pending acceptance.' },
          { status: 429 }
        );
      }
    } else {
      // Rate limit: max 10 new conversations in 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('initiator_id', ctx!.id)
        .gte('created_at', since);

      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          { error: 'Daily limit for new contact requests reached. Please try again tomorrow.' },
          { status: 429 }
        );
      }

      const { data: created, error: convErr } = await admin
        .from('conversations')
        .insert({ initiator_id: ctx!.id, recipient_id: recipientId, request_status: 'pending' })
        .select('id')
        .single();
      if (convErr) return NextResponse.json({ error: convErr.message }, { status: 400 });
      convId = created.id;
    }
  } else {
    return NextResponse.json({ error: 'conversation_id or recipient_id is required.' }, { status: 400 });
  }

  const { data: msg, error: msgErr } = await admin
    .from('messages')
    .insert({ conversation_id: convId, sender_id: ctx!.id, body: text })
    .select('*')
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 400 });
  return NextResponse.json({ ok: true, message: msg, conversation_id: convId });
}

export async function PATCH(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'alumni');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: { conversation_id?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.conversation_id || !['accept', 'decline', 'block', 'report'].includes(body.action ?? '')) {
    return NextResponse.json({ error: 'Valid conversation_id and action required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from('conversations')
    .select('*')
    .eq('id', body.conversation_id)
    .maybeSingle();

  if (!conv || (conv.initiator_id !== ctx!.id && conv.recipient_id !== ctx!.id)) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const otherId = conv.initiator_id === ctx!.id ? conv.recipient_id : conv.initiator_id;

  if (body.action === 'accept' || body.action === 'decline') {
    if (conv.recipient_id !== ctx!.id) {
      return NextResponse.json({ error: 'Only the recipient can accept or decline a request.' }, { status: 403 });
    }
    await admin
      .from('conversations')
      .update({ request_status: body.action === 'accept' ? 'accepted' : 'declined' })
      .eq('id', conv.id);
  } else if (body.action === 'block') {
    await admin
      .from('user_blocks')
      .insert({ blocker_id: ctx!.id, blocked_id: otherId })
      .select()
      .maybeSingle();
  } else if (body.action === 'report') {
    await admin.from('message_reports').insert({
      reporter_id: ctx!.id,
      conversation_id: conv.id,
      reason: body.reason?.trim() || 'Inappropriate message',
    });
  }

  return NextResponse.json({ ok: true });
}
