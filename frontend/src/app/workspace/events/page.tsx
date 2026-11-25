import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function WorkspaceEventsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, slug, title, status, starts_at, venue, is_paid, fee_amount')
    .order('created_at', { ascending: false });

  const STATUS_COLOR: Record<string, string> = {
    draft: 'var(--text-muted)',
    published: 'var(--success)',
    ongoing: 'var(--color-3-accent-personality)',
    closed: 'var(--text-muted)',
  };

  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 6px' }}>
          <Link href="/workspace" style={{ color: 'inherit', textDecoration: 'none' }}>Workspace</Link> /
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Event Management</h1>
            <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15 }}>
              Create events, assign Event Leads (SPOCs), and manage guest speakers.
            </p>
          </div>
          <Link href="/workspace/events/new" className="btn btn-primary" style={{ fontSize: 14, flexShrink: 0 }}>
            + Create Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      {events && events.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginTop: 24 }}>
          {(['draft', 'published', 'ongoing', 'closed'] as const).map(s => (
            <div key={s} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: STATUS_COLOR[s] }}>{(events ?? []).filter(e => e.status === s).length}</div>
              <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        {!events || events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="card-meta" style={{ margin: '0 0 20px' }}>No events yet. Click <strong>+ Create Event</strong> to get started.</p>
            <Link href="/workspace/events/new" className="btn btn-primary">Create First Event</Link>
          </div>
        ) : (
          <div className="grid">
            {events.map((ev) => (
              <article key={ev.id} className="card">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: STATUS_COLOR[ev.status] ?? 'var(--text-muted)' }}>
                    {ev.status}
                  </span>
                  <span className="mono-meta">{ev.is_paid ? `₹${ev.fee_amount}` : 'Free'}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{ev.title}</h2>
                <p className="mono-meta" style={{ margin: 0 }}>
                  {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                  {ev.venue ? ` · ${ev.venue}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 10, flexWrap: 'wrap' }}>
                  <Link href={`/workspace/events/${ev.id}`} style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
                  {ev.status !== 'draft' && (
                    <Link href={`/events/${ev.slug}`} style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Public →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p style={{ marginTop: 32 }}>
        <Link href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>← Dashboard</Link>
      </p>
    </>
  );
}
