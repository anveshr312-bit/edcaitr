import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getUserRole } from '../../../../../lib/auth/authorization';
import CheckinClient from './CheckinClient';

export const dynamic = 'force-dynamic';

export default async function EventCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const { data: allowed } = await supabase.rpc('is_rd_or_manager', {
    p_event_id: id,
    p_user_id: user.id,
  });
  if (!allowed) redirect('/workspace');

  const { data: event } = await supabase
    .from('events')
    .select('id, title, google_sheet_id')
    .eq('id', id)
    .maybeSingle();

  if (!event) notFound();

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/workspace/events/${id}`}>← Event overview</Link> ·{' '}
        <Link href={`/workspace/events/${id}/registrations`}>Registrations</Link>
      </p>
      <h1>RD QR Check-in: {event.title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Scan participant ticket QR codes using your camera or enter the QR token directly.
        {event.google_sheet_id
          ? ' Live Google Sheets sync is enabled for this event.'
          : ' Google Sheet ID is not configured on this event (portal attendance still records).'}
      </p>
      <CheckinClient eventId={id} />
    </>
  );
}
