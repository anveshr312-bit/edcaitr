import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, events(title)')
    .order('created_at', { ascending: false });

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/portal">← Participant Portal</Link>
      </p>
      <h1>Announcements</h1>
      {!announcements || announcements.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No announcements posted yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {announcements.map((a) => {
            const ev = Array.isArray(a.events) ? a.events[0] : a.events;
            return (
              <article key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-accent">{ev?.title ?? 'General'}</span>
                  <span className="mono-meta">{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{a.title}</h2>
                <p style={{ margin: 0 }}>{a.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
