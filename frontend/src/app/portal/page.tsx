import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getPublicEvents } from '../../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function ParticipantPortalPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const [{ data: registrations }, { data: announcements }, events] = await Promise.all([
    supabase
      .from('registrations')
      .select('id, status, payment_status, events(title, slug, starts_at, venue)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    getPublicEvents(false),
  ]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Participant Portal</h1>
          <p className="card-meta" style={{ margin: 0 }}>
            Your event registrations, QR tickets, and announcements.
          </p>
        </div>
        <div className="actions-row" style={{ marginTop: 0 }}>
          <Link href="/portal/registrations" className="btn btn-primary">
            Your Registrations
          </Link>
          <Link href="/portal/certificates" className="btn">
            Your Certificates
          </Link>
          <Link href="/portal/announcements" className="btn">
            Announcements
          </Link>
        </div>
      </div>

      <section>
        <h2>Your Recent Registrations</h2>
        {!registrations || registrations.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              You have not registered for any events yet. Browse upcoming events below to get your
              QR pass.
            </p>
          </div>
        ) : (
          <div className="grid">
            {registrations.map((reg) => {
              const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
              return (
                <article key={reg.id} className="card">
                  <span className="badge badge-accent">{reg.status.replace('_', ' ')}</span>
                  <h3 style={{ margin: 0 }}>{ev?.title ?? 'Event'}</h3>
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {ev?.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                    {ev?.venue ? ` · ${ev.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/portal/registrations/${reg.id}`}>View ticket / details</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {announcements && announcements.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Recent Announcements</h2>
            <Link href="/portal/announcements">All announcements</Link>
          </div>
          <div className="grid">
            {announcements.map((a) => (
              <article key={a.id} className="card">
                <h3 style={{ margin: 0 }}>{a.title}</h3>
                <p className="card-meta" style={{ margin: 0 }}>{a.body}</p>
                <span className="mono-meta">{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Explore Events</h2>
        <div className="grid">
          {events.slice(0, 3).map((ev) => (
            <article key={ev.id} className="card">
              <span className="badge">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
              <h3 style={{ margin: 0 }}>{ev.title}</h3>
              {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <Link href={`/events/${ev.slug}`}>Open &amp; register</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
