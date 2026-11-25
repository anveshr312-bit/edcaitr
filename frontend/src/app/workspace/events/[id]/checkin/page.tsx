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
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / QR Check-in
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-3-accent-personality)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
              <rect width="5" height="5" x="3" y="16" rx="1"/>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3M16 21h.01M21 21v.01M12 7v3a1 1 0 0 1-1 1H7M7 12h.01M12 12h.01M12 21h.01M17 12h.01"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 700 }}>RD QR Check-in</h1>
            <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 14 }}>
              {event.google_sheet_id
                ? 'Live Google Sheets sync enabled.'
                : 'Google Sheet not configured — portal attendance records only.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/workspace/events/${id}`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Overview</Link>
          <Link href={`/workspace/events/${id}/registrations`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Registrations</Link>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15, lineHeight: 1.65 }}>
          Scan participant ticket QR codes using your camera or enter the QR token directly.
        </p>
        <CheckinClient eventId={id} />
      </div>
    </>
  );
}
