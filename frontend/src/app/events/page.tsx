import Link from 'next/link';
import { getPublicEvents } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getPublicEvents(false);
  const activeEvents = events.filter((e) => e.status === 'published' || e.status === 'ongoing');
  const concludedDbEvents = events.filter((e) => e.status === 'closed');

  const PASS_TIERS = [
    {
      title: 'AITR Student Pass',
      price: 'Free',
      badge: 'Institution Verified',
      features: [
        'Access to all open Founder Talks & Creator’s Connect',
        'Campus exhibition zone and startup stall access',
        'Official PVR cinema-style QR digital pass',
        'Verified participation certificate',
      ],
      cta: 'Claim Free Pass',
    },
    {
      title: 'External Delegate Pass',
      price: 'Free / Subsidized',
      badge: 'Open to All Colleges',
      features: [
        'Access for students from any university in Central India',
        'Transit access via Acropolis buses (Indore, Dewas, Ujjain, Maksi)',
        'Entry to keynote sessions and panel discussions',
        'Digital QR pass with gate scanner verification',
      ],
      cta: 'Register as Delegate',
    },
    {
      title: 'PitchBiz Founder Desk',
      price: 'By Application',
      badge: 'Funding & VCs',
      features: [
        'Direct pitching slot before Angel Investors and VCs',
        'Access to Mentoring Circles with experienced founders',
        'Product demo & stall space in exhibition avenue',
        'Investor syndication consideration',
      ],
      cta: 'Apply to Pitch',
    },
    {
      title: 'Workshop Masterclass Pass',
      price: 'Track Specific',
      badge: 'Hands-on Skill',
      features: [
        'Intensive hands-on masterclass sessions',
        'Direct Q&A with domain specialists',
        'Practical frameworks, templates and learning kits',
        'Specialized masterclass completion credential',
      ],
      cta: 'View Masterclasses',
    },
  ];

  const PAST_EDITIONS = [
    {
      title: 'E-Summit 2025',
      dates: 'Annual Conclave',
      desc: 'Central India’s premier student entrepreneurship summit featuring venture pitches, fireside keynotes, and founder circles.',
    },
    {
      title: 'E-Summit 2024 & 2023',
      dates: 'Pioneering Editions',
      desc: 'Established the student venture ecosystem at Acropolis with over 100+ startups evaluated and dozens of angel interactions.',
    },
    {
      title: 'TEDx Acropolis & TEDx Vijaynagar',
      dates: 'Ideas Worth Spreading',
      desc: 'Curated platforms bringing together artists, tech pioneers, and social innovators for thought-provoking talks.',
    },
    {
      title: 'Kriyeta National Hackathon',
      dates: 'Product Prototyping',
      desc: 'Over 48 hours of relentless engineering and design, turning student ideas into demonstrable working MVP code.',
    },
    {
      title: 'IIC Regional Meet (Ministry of Education)',
      dates: 'Innovation Cell',
      desc: 'Conclave uniting innovation ambassadors, institutional heads, and student leaders across regional colleges.',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 64 }}>
      {/* Header Band */}
      <section style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '56px clamp(16px,4vw,48px)', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 32, background: 'rgba(224,72,38,0.12)', border: '1px solid rgba(224,72,38,0.3)', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-3-accent-personality)' }}>
              Official Flagship Summit
            </span>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.1 }}>
            E-Summit &amp; Campus Events
          </h1>
          <p style={{ margin: 0, color: 'rgba(251,249,245,0.7)', fontSize: 16, maxWidth: 640, lineHeight: 1.65 }}>
            Upcoming summits, hackathons, and guest masterclasses hosted by EDC AITR and AIIH Foundation at Acropolis Institute of Technology and Research, Indore.
          </p>
        </div>
      </section>

      {/* Flagship: FOKUS X E-Summit 2026 Spotlight Card */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ padding: 'clamp(24px, 4vw, 40px)', background: 'var(--surface)', border: '2px solid var(--border-hairline)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 10, display: 'inline-block' }}>
                Flagship Summit 2026
              </span>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', fontWeight: 800 }}>
                FOKUS X E-SUMMIT 2026
              </h2>
              <p className="mono-meta" style={{ margin: '8px 0 0', fontSize: 14 }}>
                18th – 20th March 2026 · Acropolis Institute of Technology &amp; Research, Indore
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-3-accent-personality)' }}>3 Days</div>
              <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Central India&apos;s Largest</div>
            </div>
          </div>

          <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 840 }}>
            Combining real-world pitching with <strong>PitchBiz</strong>, masterclasses, and keynote dialogues featuring industry founders, artists, and venture capitalists. Supported by 12 operational student teams ensuring seamless logistics, audio-visuals, and crowd management.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, background: 'var(--surface-subtle)', padding: '20px', borderRadius: 8, marginBottom: 28 }}>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>PitchBiz Desk</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Live VC &amp; Angel pitch track</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>Creator&apos;s Connect 2.0</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>National creators &amp; artists</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>Innovation Contest</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Prototype &amp; model evaluation</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 14 }}>Regional Bus Transit</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Indore, Dewas, Ujjain, Maksi</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/account" className="btn btn-primary">
              Register for E-Summit 2026
            </Link>
            <Link href="/contact" className="btn">
              Inquire for Sponsorship
            </Link>
          </div>
        </div>
      </section>

      {/* Ticket Pass Tiers — Modulify Metric "Choose your pass" */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Pass Categories
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            Choose Your Pass
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {PASS_TIERS.map((tier) => (
            <article key={tier.title} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '28px 24px' }}>
              <span className="badge" style={{ width: 'fit-content', marginBottom: 12 }}>
                {tier.badge}
              </span>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 700 }}>{tier.title}</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-3-accent-personality)', marginBottom: 16 }}>
                {tier.price}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 'auto' }}>
                <Link href="/account" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  {tier.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Database Active Events (if any) */}
      {activeEvents.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Current Registrations Open
            </h2>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800 }}>
              Live Calendar Events ({activeEvents.length})
            </div>
          </div>

          <div className="grid">
            {activeEvents.map((ev) => {
              const posterUrl = getImageKitUrl(ev.poster_ref);
              return (
                <article key={ev.id} className="card">
                  {posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={posterUrl} alt={ev.title} className="poster" />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-accent">{ev.status.replace('_', ' ')}</span>
                    <span className="mono-meta">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{ev.title}</h3>
                  {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {ev.starts_at ? new Date(ev.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Schedule TBA'}
                    {ev.venue ? ` · ${ev.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                    <Link href={`/events/${ev.slug}`} className="btn btn-primary" style={{ fontSize: 14 }}>
                      Open &amp; Register
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Past Editions Archive */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
            Past Editions Archive
          </h2>
          <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800 }}>
            Concluded Flagship Events
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PAST_EDITIONS.map((p) => (
            <div key={p.title} className="card" style={{ padding: '20px 24px', opacity: 0.9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge">Concluded</span>
                <span className="mono-meta">{p.dates}</span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {p.desc}
              </p>
            </div>
          ))}

          {concludedDbEvents.map((ev) => (
            <div key={ev.id} className="card" style={{ padding: '20px 24px', opacity: 0.9 }}>
              <span className="badge">Concluded</span>
              <h3 style={{ margin: '8px 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{ev.title}</h3>
              {ev.summary && <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)' }}>{ev.summary}</p>}
              <Link href={`/events/${ev.slug}`} style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>
                View event highlights →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
