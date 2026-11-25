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
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href="/portal" style={{ color: 'inherit', textDecoration: 'none' }}>Portal</Link> / Updates
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Announcements
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 540, lineHeight: 1.6 }}>
          Official updates, schedule changes, and event broadcasts from the organizers.
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        {!announcements || announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            <p className="card-meta" style={{ margin: 0 }}>No announcements posted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {announcements.map((a) => {
              const ev = Array.isArray(a.events) ? a.events[0] : a.events;
              return (
                <article key={a.id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {ev?.title && <span className="badge badge-accent">{ev.title}</span>}
                      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{a.title}</h2>
                    </div>
                    <span className="mono-meta" style={{ flexShrink: 0 }}>{new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{a.body}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
