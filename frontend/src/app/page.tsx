import Link from 'next/link';
import { getPublicEvents, getPublicTeamProfiles } from '../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [events, team] = await Promise.all([
    getPublicEvents(false),
    getPublicTeamProfiles(),
  ]);

  const featured = events.slice(0, 3);
  const activeCount = events.filter((e) => e.status === 'published' || e.status === 'ongoing').length;

  return (
    <>
      {/* Hero — full-bleed dark band */}
      <section style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: 'clamp(56px,8vw,96px) clamp(16px,4vw,48px)', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(240px,1fr)', gap: 48, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-3-accent-personality)', fontWeight: 700, marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)', display: 'inline-block' }} />
              Acropolis Institute of Technology &amp; Research
            </span>
            <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(2rem,4.5vw,3.4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              Student-led<br />entrepreneurship<br />and venture building
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: 'clamp(1rem,1.5vw,1.15rem)', color: 'rgba(251,249,245,0.72)', lineHeight: 1.65, maxWidth: 520 }}>
              EDC AITR connects students, early-stage founders, and alumni through campus summits,
              practical workshops, and structured operational teams.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/events" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
                Explore Events
              </Link>
              <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'rgba(251,249,245,0.8)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(251,249,245,0.25)' }}>
                Sign in or register
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats ledger */}
          <aside style={{ borderLeft: '1px solid rgba(251,249,245,0.12)', paddingLeft: 40 }}>
            {[
              { label: 'Published events', value: events.length },
              { label: 'Active upcoming', value: activeCount },
              { label: 'Public team members', value: team.length },
              { label: 'Operational teams', value: 12 },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '18px 0', borderBottom: '1px solid rgba(251,249,245,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontSize: 13, color: 'rgba(251,249,245,0.5)', letterSpacing: '0.02em' }}>{label}</span>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* How EDC operates */}
      <section style={{ maxWidth: 1100, margin: '72px auto 0', padding: '0 clamp(0px,2vw,0px)' }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 32px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          How EDC AITR Operates
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2, background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }}>
          {[
            { icon: '▸', title: 'Open Registration', body: 'Events are open to students across colleges, external founders, and startup representatives — not just AITR students.' },
            { icon: '▸', title: '12 Operational Teams', body: 'RD, AV, Stage, Logistics, Crowd, CLIX, Guest, Docs, Anchoring, Design, Video, Social — each with dedicated coordinators.' },
            { icon: '▸', title: 'Verified Tenure', body: 'Every contribution is recorded with effective dates. Departing members transition into the verified Alumni Connect network.' },
            { icon: '▸', title: 'Director-governed', body: 'Role promotions and sensitive actions require MFA-verified Director approval, keeping the org structure accountable.' },
          ].map(({ icon: _icon, title, body }) => (
            <div key={title} style={{ background: 'var(--surface)', padding: '28px 24px', display: 'grid', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-tint)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured events */}
      {featured.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '72px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem,2vw,1.6rem)', fontWeight: 700 }}>Featured Events</h2>
            <Link href="/events" style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>
              All events →
            </Link>
          </div>
          <div className="grid">
            {featured.map((ev) => (
              <article key={ev.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-accent">{ev.status === 'closed' ? 'Concluded' : ev.status.replace('_', ' ')}</span>
                  <span className="mono-meta">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{ev.title}</h3>
                {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                <p className="mono-meta" style={{ margin: 0 }}>
                  {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Date TBA'}
                  {ev.venue ? ` · ${ev.venue}` : ''}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Link href={`/events/${ev.slug}`} style={{ color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                    Open &amp; Register →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Join CTA — dark band */}
      <section style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,48px)', marginLeft: -24, marginRight: -24, marginTop: 72, textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', marginBottom: 16 }}>Join EDC AITR</p>
        <h2 style={{ margin: '0 auto 20px', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, maxWidth: 540, lineHeight: 1.15 }}>
          Ready to build something real?
        </h2>
        <p style={{ margin: '0 auto 32px', maxWidth: 480, color: 'rgba(251,249,245,0.65)', fontSize: 15, lineHeight: 1.65 }}>
          Create an account, register for events, and apply to join the Core Team.
          Every verified member gets a permanent record of their contributions.
        </p>
        <Link href="/account" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
          Create Account
        </Link>
      </section>
    </>
  );
}
