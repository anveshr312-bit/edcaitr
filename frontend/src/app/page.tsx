import Link from 'next/link';
import { getPublicEvents } from '../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await getPublicEvents(false);
  const activeEvents = events.filter((e) => e.status === 'published' || e.status === 'ongoing');

  const PAST_SPEAKERS = [
    { name: 'Piyush Mishra', role: 'Poet, Lyricist, Actor & Singer', tag: 'Cultural Icon' },
    { name: 'Chandubhai Virani', role: 'Founder & Chairman, Balaji Wafers', tag: 'D2C Legend' },
    { name: 'Siddharth Dungarwal', role: 'Founder, Snitch', tag: 'Fashion D2C' },
    { name: 'Sunita Rajwar', role: 'Actor (Film, Television & Theatre)', tag: 'Cinema & Arts' },
    { name: 'Abhishek Kar', role: 'Stock Market Expert & Content Creator', tag: 'Finance' },
    { name: 'Laxmi Narayan Tripathi', role: 'Author, Activist & Public Speaker', tag: 'Thought Leader' },
    { name: 'Ridhima Arora', role: 'Founder, Namhya Foods', tag: 'Shark Tank / FMCG' },
    { name: 'Shreyaan Daga', role: 'Founder, OLL', tag: 'Young Founder' },
  ];

  const PAST_MEGA_EVENTS = [
    { title: 'E-Summit 2025', desc: 'Central India’s flagship youth entrepreneurship conclave with venture showcases.' },
    { title: 'TEDx Acropolis & TEDx Vijaynagar', desc: 'Independently organized TED events celebrating ideas and disruptive perspectives.' },
    { title: 'Kriyeta', desc: 'National-level innovation and ideation hackathon fostering product prototypes.' },
    { title: 'IIC Regional Meet', desc: 'Ministry of Education Innovation Cell conclave hosted at Acropolis Campus.' },
    { title: 'LitFest & EN Talks', desc: 'Vibrant cultural, literary, and entrepreneurship dialogue series.' },
    { title: 'Joy of Giving', desc: 'Social impact initiative uniting hundreds of students for community empowerment.' },
  ];

  const SUMMIT_TRACKS = [
    {
      title: 'PitchBiz (Startup Pitching)',
      desc: 'High-potential startups pitch live before VCs and Angel Investors (Lead Angels, TiE, RAIN) for funding and syndication.',
      badge: 'Funding & Discovery',
    },
    {
      title: 'Creator’s Connect 2.0 & Founder Talks',
      desc: 'Exclusive fireside keynotes and interactive panel discussions with top creators, industry icons, and unicorn operators.',
      badge: 'Keynotes & Media',
    },
    {
      title: 'Innovation & Business Model Contests',
      desc: 'Competitive tracks evaluating prototype feasibility, market viability, unit economics, and execution roadmap.',
      badge: 'Competitions',
    },
    {
      title: 'Mentoring Circles & Masterclasses',
      desc: 'Focused tactical workshops on product-market fit, legal compliance, term sheets, and early-stage distribution.',
      badge: 'Skill Building',
    },
  ];

  const OPERATIONAL_TEAMS = [
    { code: 'RD', name: 'Research & Development', desc: 'Problem statements, hackathon rules & ecosystem intelligence.' },
    { code: 'AV', name: 'Audio / Visual', desc: 'Sound engineering, live feeds, lighting & stage tech.' },
    { code: 'STAGE', name: 'Stage Management', desc: 'Dignitary cueing, run-of-show & on-stage coordination.' },
    { code: 'LOGISTICS', name: 'Logistics', desc: 'Equipment movement, inventory & vendor delivery.' },
    { code: 'CROWD', name: 'Crowd Control', desc: 'Auditorium flow, access zones & perimeter security.' },
    { code: 'CLIX', name: 'CLIX (Photo & Media)', desc: 'Official event photography, session documentation & reels.' },
    { code: 'GUEST', name: 'Guest Relations', desc: 'Hospitality, transport & protocol for keynote speakers.' },
    { code: 'DOCS', name: 'Documentation', desc: 'Reports, official MoUs, post-event analytics & compliance.' },
    { code: 'ANCHORING', name: 'Anchoring', desc: 'Emcees, stage hosts & session moderation.' },
    { code: 'DESIGN', name: 'Design & Visual Identity', desc: 'Banners, stage backdrops, passes & digital collateral.' },
    { code: 'VIDEO', name: 'Video Production', desc: 'Recap films, live broadcasts & promo campaigns.' },
    { code: 'SOCIAL', name: 'Social Media & Outreach', desc: 'Real-time coverage on @edc_acropolis & viral engagement.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 64 }}>
      {/* Light Hero Section — Metric Structure with Warm Studio Aesthetic */}
      <section className="card" style={{ padding: 'clamp(36px, 5vw, 56px)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', background: 'var(--surface)', margin: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 1fr)', gap: 40, alignItems: 'center' }}>
          <div>
            {/* Live Flagship Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 32, background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-3-accent-personality)' }}>
                18th – 20th March 2026 · AITR Indore
              </span>
            </div>

            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 3.8vw, 3.2rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              FOKUS X E-SUMMIT 2026
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
              Central India&apos;s Flagship Student Entrepreneurship &amp; Venture Conclave.
            </p>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}>
              Presented by the Entrepreneurship Development Cell (EDC) &amp; AIIH Foundation at Acropolis Group of Institutions. Bridging academia and industry through live pitching, mentor circles, and high-impact keynotes.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/events" className="btn btn-primary" style={{ fontSize: 14, padding: '12px 26px' }}>
                Explore Events &amp; Passes
              </Link>
              <Link href="/contact" className="btn" style={{ fontSize: 14, padding: '12px 20px' }}>
                Sponsor &amp; Partner
              </Link>
            </div>
          </div>

          {/* Institutional Reach Ledger — Light Surface with Dark Badges */}
          <aside style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: '24px 28px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14, borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 8 }}>
              Ecosystem Snapshot
            </div>
            {[
              { label: 'Audience Reach', value: '2 Lakh+' },
              { label: 'Social Community', value: '5,000+' },
              { label: 'Operational Teams', value: '12 Teams' },
              { label: 'Past Investors & Angels', value: '15+' },
              { label: 'Regional Bus Transit', value: '4 Cities' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* Flagship Activities — The Metric Bento Layout */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            What You Can Expect
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            Flagship Activities at E-Summit
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {SUMMIT_TRACKS.map((t) => (
            <article key={t.title} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '26px 22px' }}>
              <span className="badge badge-accent" style={{ width: 'fit-content', marginBottom: 12 }}>
                {t.badge}
              </span>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 700 }}>{t.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {t.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Past Keynote Speakers & Luminaries */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Eminent Voices
            </h2>
            <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
              Past Keynotes &amp; Industry Leaders
            </div>
          </div>
          <span className="stamp-label">
            <span className="stamp-dot" />
            Acropolis Alumni &amp; Dignitaries
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PAST_SPEAKERS.map((s) => (
            <div key={s.name} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.05rem' }}>
                  {s.name.charAt(0)}
                </div>
                <span className="mono-meta" style={{ fontSize: 11, background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {s.tag}
                </span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>{s.name}</h3>
              <p className="card-meta" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                {s.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Past Mega Events Showcase */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Legacy &amp; Footprint
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            Past Mega Events at Acropolis
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PAST_MEGA_EVENTS.map((ev) => (
            <div key={ev.title} className="card" style={{ padding: '22px' }}>
              <span className="badge" style={{ marginBottom: 8 }}>Flagship Record</span>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{ev.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ev.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 12 Operational Teams Showcase */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Student Execution Engine
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            The 12 Operational Teams
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 600, fontSize: 14 }}>
            Every summit and campus initiative is powered by student-led operational teams with verified responsibilities under the Director and faculty advisors.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {OPERATIONAL_TEAMS.map((t) => (
            <div key={t.code} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-3-accent-personality)', background: 'var(--accent-tint)', padding: '2px 6px', borderRadius: 4 }}>
                  {t.code}
                </span>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{t.name}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Events from Database (if any) */}
      {activeEvents.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Active Calendar Registrations
            </h2>
            <Link href="/events" style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', fontWeight: 600, textDecoration: 'none' }}>
              All events →
            </Link>
          </div>
          <div className="grid">
            {activeEvents.map((ev) => (
              <article key={ev.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-accent">{ev.status}</span>
                  <span className="mono-meta">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{ev.title}</h3>
                {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                <p className="mono-meta" style={{ margin: 0 }}>
                  {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                  {ev.venue ? ` · ${ev.venue}` : ''}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <Link href={`/events/${ev.slug}`} className="btn btn-primary" style={{ fontSize: 13, width: 'fit-content' }}>
                    Open &amp; Register →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Light Community & Instagram Banner */}
      <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '48px clamp(16px, 4vw, 40px)', textAlign: 'center', margin: 0 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Stay in the Loop
        </p>
        <h2 style={{ margin: '0 auto 12px', fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)', fontWeight: 800, maxWidth: 600, lineHeight: 1.2 }}>
          Join the EDC AITR Community on Instagram
        </h2>
        <p style={{ margin: '0 auto 24px', maxWidth: 520, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.65 }}>
          Real-time updates, speaker reveals, hackathon announcements, and backstage moments from the 12 operational teams.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://www.instagram.com/edc_acropolis"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: 14, padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            Follow @edc_acropolis
          </a>
          <Link href="/account" className="btn" style={{ fontSize: 14, padding: '10px 20px' }}>
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}
