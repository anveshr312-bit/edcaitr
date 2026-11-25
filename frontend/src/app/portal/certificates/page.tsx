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
      <p style={{ marginBottom: 16 }}>
        <Link href="/portal">← Participant Portal</Link>
      </p>
      <h1>Your Certificates</h1>
      {!certs || certs.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No certificates have been issued to your account yet.
          </p>
        </div>
      ) : (
        <div className="grid">
          {certs.map((c) => {
            const ev = Array.isArray(c.events) ? c.events[0] : c.events;
            return (
              <article key={c.id} className="card">
                <span className="badge badge-accent">{c.certificate_code}</span>
                <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{c.title}</h2>
                <p className="card-meta" style={{ margin: 0 }}>
                  {ev?.title ?? 'EDC AITR Event'}
                </p>
                <span className="mono-meta">
                  Issued {new Date(c.issued_at).toLocaleDateString('en-IN')}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
