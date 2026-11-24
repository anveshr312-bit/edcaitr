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

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Event Management</h1>
          <p className="card-meta" style={{ margin: 0 }}>
            Create events, assign Event Leads (SPOCs), and manage guest speakers.
          </p>
        </div>
        <Link href="/workspace/events/new" className="btn btn-primary">
          + Create Event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No events created yet. Click <strong>+ Create Event</strong> to get started.
          </p>
        </div>
      ) : (
        <div className="grid">
          {events.map((ev) => (
            <article key={ev.id} className="card">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-accent">{ev.status}</span>
                <span className="badge">{ev.is_paid ? `₹${ev.fee_amount}` : 'Free'}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{ev.title}</h2>
              <p className="card-meta" style={{ margin: 0 }}>
                {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                {ev.venue ? ` · ${ev.venue}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
                <Link href={`/workspace/events/${ev.id}`}>Manage →</Link>
                {ev.status !== 'draft' && (
                  <Link href={`/events/${ev.slug}`} style={{ color: 'var(--text-muted)' }}>
                    Public view
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p style={{ marginTop: 32 }}>
        <Link href="/account/dashboard">← Back to dashboard</Link>
      </p>
    </>
  );
}
