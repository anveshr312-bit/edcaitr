import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ParticipantCertificatesPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, certificate_code, title, issued_at, events(title, slug, starts_at)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 6px' }}>
          <Link href="/portal" style={{ color: 'inherit', textDecoration: 'none' }}>Portal</Link> /
        </p>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Your Certificates</h1>
      </div>

      <div style={{ marginTop: 32 }}>
        {!certs || certs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
            <p className="card-meta" style={{ margin: '0 0 8px' }}>No certificates issued yet.</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Certificates are issued after confirmed event attendance.</p>
          </div>
        ) : (
          <div className="grid">
            {certs.map((c) => {
              const ev = Array.isArray(c.events) ? c.events[0] : c.events;
              return (
                <article key={c.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Decorative corner */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'var(--accent-tint)', borderBottomLeftRadius: '100%' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-3-accent-personality)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                    {c.certificate_code}
                  </span>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>{c.title}</h2>
                  <p className="card-meta" style={{ margin: '0 0 12px' }}>{ev?.title ?? 'EDC AITR Event'}</p>
                  <p className="mono-meta" style={{ margin: 0 }}>
                    Issued {new Date(c.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
