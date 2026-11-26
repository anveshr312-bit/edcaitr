import { eventAvailability } from '../../lib/events/lifecycle';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicEvents } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';
import { createPageMetadata } from '../../lib/seo';
import { BreadcrumbStructuredData } from '../../components/StructuredData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Events & Summits — E-Summit, Hackathons & Conclaves',
  description: 'Explore upcoming entrepreneurship summits, Kriyeta hackathons, PitchBiz investor arenas, and masterclasses hosted by EDC AITR in Indore.',
  path: '/events',
  keywords: [
    'EDC AITR events',
    'Startup events in Indore',
    'Entrepreneurship workshops in Indore',
    'FOKUS X E-Summit 2026',
    'Kriyeta Hackathon',
    'PitchBiz Acropolis',
  ],
});

export default async function EventsPage() {
  const events = await getPublicEvents(true);
  const activeEvents = events.filter((e) => ['ongoing', 'upcoming'].includes(eventAvailability(e).lifecycle));
  const concludedDbEvents = events.filter((e) => !activeEvents.includes(e));

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
    <div style={{ display: 'grid', gap: 56 }}>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'Events & Summits', path: '/events' },
        ]}
      />
      {/* Light Header Band */}
      <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(32px, 4vw, 48px)', margin: 0 }}>
        <div style={{ maxWidth: 1100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
              EDC AITR Event Calendar
            </span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
            Events &amp; Summits
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, lineHeight: 1.65 }}>
            Discover upcoming summits, hackathons, founder masterclasses, and networking conclaves hosted by the Entrepreneurship Development Cell (EDC AITR) and AIIH Foundation.
          </p>
        </div>
      </section>

      {/* Flagship: FOKUS X E-Summit 2026 Spotlight Card */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ padding: 'clamp(24px, 4vw, 36px)', background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-block' }}>
                Flagship Summit 2026
              </span>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
                FOKUS X E-SUMMIT 2026
              </h2>
              <p className="mono-meta" style={{ margin: '6px 0 0', fontSize: 13 }}>
                18th – 20th March 2026 · Acropolis Institute of Technology &amp; Research, Indore
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-3-accent-personality)' }}>3 Days</div>
              <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Central India&apos;s Largest</div>
            </div>
          </div>

          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 840 }}>
            Combining real-world pitching with <strong>PitchBiz</strong>, masterclasses, and keynote dialogues featuring industry founders, artists, and venture capitalists. Supported by 12 operational student teams ensuring seamless logistics, audio-visuals, and crowd management.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: 'var(--surface-subtle)', padding: '18px', borderRadius: 'var(--radius-card)', marginBottom: 24 }}>
            <div>
              <strong id="pitchbiz" style={{ display: 'block', fontSize: 13 }}>PitchBiz Desk</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live VC &amp; Angel pitch track</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>Creator&apos;s Connect 2.0</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>National creators &amp; artists</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>Innovation Contest</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prototype &amp; model evaluation</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>Regional Bus Transit</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Indore, Dewas, Ujjain, Maksi</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

            <Link href="/contact" className="btn">
              Inquire for Sponsorship
            </Link>
          </div>
        </div>
      </section>

      {/* Ticket Pass Tiers — Modulify Metric "Choose your pass" */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Pass Categories
          </h2>
          <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800 }}>
            2026 Summit Pass Categories
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {PASS_TIERS.map((tier) => (
            <article key={tier.title} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
              <span className="badge" style={{ width: 'fit-content', marginBottom: 10 }}>
                {tier.badge}
              </span>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>{tier.title}</h3>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-3-accent-personality)', marginBottom: 14 }}>
                {tier.price}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'grid', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>


            </article>
          ))}
        </div>
      </section>

      {/* Database Active Events (if any) */}
      {activeEvents.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 6px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Upcoming and ongoing events
            </h2>
            <div style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', fontWeight: 800 }}>
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
                    <span className="badge badge-accent">{eventAvailability(ev).lifecycle}</span>
                    <span className="mono-meta">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{ev.title}</h3>
                  {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {ev.starts_at ? new Date(ev.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : 'Schedule TBA'}
                    {ev.venue ? ` · ${ev.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                    <Link href={`/events/${ev.slug}`} className="btn btn-primary" style={{ fontSize: 13 }}>
                      View event details
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
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 6px', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
            Past Editions Archive
          </h2>
          <div style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', fontWeight: 800 }}>
            Concluded Flagship Events
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {PAST_EDITIONS.map((p) => (
            <div key={p.title} className="card" style={{ padding: '18px 20px', background: 'var(--surface-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="badge">Concluded</span>
                <span className="mono-meta">{p.dates}</span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {p.desc}
              </p>
            </div>
          ))}

          {concludedDbEvents.map((ev) => (
            <div key={ev.id} className="card" style={{ padding: '18px 20px', background: 'var(--surface-subtle)' }}>
              <span className="badge">{eventAvailability(ev).lifecycle}</span>
              <h3 style={{ margin: '6px 0 4px', fontSize: '1rem', fontWeight: 700 }}>{ev.title}</h3>
              {ev.summary && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{ev.summary}</p>}
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
