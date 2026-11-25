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
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / QR Check-in
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.25)', borderRadius: 'var(--radius-control)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/>
              <rect width="5" height="5" x="3" y="16" rx="1"/>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3M16 21h.01M21 21v.01M12 7v3a1 1 0 0 1-1 1H7M7 12h.01M12 12h.01M12 21h.01M17 12h.01"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>RD QR Check-in</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {event.google_sheet_id
                ? 'Live Google Sheets sync enabled.'
                : 'Google Sheet not configured — portal attendance records only.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/workspace/events/${id}`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13 }}>Overview</Link>
          <Link href={`/workspace/events/${id}/registrations`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13 }}>Registrations</Link>
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
