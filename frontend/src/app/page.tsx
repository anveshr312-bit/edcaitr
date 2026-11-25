import Link from 'next/link';
import { getPublicEvents } from '../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await getPublicEvents(false);
  const activeEvents = events.filter((e) => e.status === 'published' || e.status === 'ongoing');

  const CORE_PILLARS = [
    {
      title: 'Pre-Incubation & Venture Support',
      desc: 'Partnering with the AIIH Foundation (Acropolis Institutional Incubation Hub) to provide prototyping labs, tech architecture guidance, and grant pipelines (DPIIT, MP Startup Policy, NIDHI-EIR).',
      badge: 'Incubation & Grants',
    },
    {
      title: 'Capital Access & PitchBiz',
      desc: 'Direct platform connecting student startups with verified Angel Networks and VCs (Lead Angels, TiE, MP Angel Network) to showcase working prototypes and raise early-stage capital.',
      badge: 'Investor Access',
    },
    {
      title: 'Flagship Conclaves & Hackathons',
      desc: 'Organizing Central India’s premier platforms including the annual E-Summit, Kriyeta National Hackathon (48-hour build sprint), TEDx Acropolis, and IIC Regional Meets.',
      badge: 'Conclaves & Sprints',
    },
    {
      title: 'Founder Circles & Masterclasses',
      desc: 'Hands-on bootcamps, term sheet deep-dives, unit economics masterclasses, and fireside keynotes with prominent Indian founders, operators, and industry leaders.',
      badge: 'Mentorship',
    },
  ];

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
    { title: 'E-Summit (Annual Conclave)', desc: 'Central India’s flagship youth entrepreneurship conclave with venture showcases, keynotes, and investor pitching.' },
    { title: 'TEDx Acropolis & TEDx Vijaynagar', desc: 'Independently organized TED events celebrating ideas, design thinking, and disruptive perspectives.' },
    { title: 'Kriyeta National Hackathon', desc: 'National-level innovation and ideation hackathon turning student problem statements into working prototypes.' },
    { title: 'IIC Regional Meet', desc: 'Ministry of Education Innovation Cell conclave hosted at Acropolis Campus uniting regional institutions.' },
    { title: 'LitFest & EN Talks', desc: 'Vibrant cultural, literary, and entrepreneurship dialogue series with authors and startup pioneers.' },
    { title: 'Joy of Giving', desc: 'Institutional social entrepreneurship initiative uniting hundreds of students for community empowerment.' },
  ];

  const OPERATIONAL_TEAMS = [
    { code: 'RD', name: 'Research & Development', desc: 'Problem statements, hackathon frameworks & ecosystem intelligence.' },
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
      {/* Light Hero Section — EDC AITR Official Portal */}
      <section className="card" style={{ padding: 'clamp(36px, 5vw, 56px)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', background: 'var(--surface)', margin: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 1fr)', gap: 40, alignItems: 'center' }}>
          <div>
            {/* Institutional Cell Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 32, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
                Entrepreneurship Development Cell · Acropolis Indore
              </span>
            </div>

            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2.1rem, 3.8vw, 3.3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Where Student Innovation Meets Venture Execution.
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: 'clamp(1rem, 1.4vw, 1.2rem)', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.45 }}>
              The official entrepreneurship hub and startup launchpad of Acropolis Group of Institutions, in partnership with AIIH Foundation.
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 540 }}>
              Empowering student founders, innovators, and future leaders across Central India through pre-incubation, venture capital connections, statewide hackathons, and our annual flagship conclave, E-Summit.
            </p>

            {/* Upcoming Flagship Banner Inside Hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-control)', marginBottom: 24, flexWrap: 'wrap' }}>
              <span className="badge badge-accent" style={{ fontSize: 11 }}>Flagship Conclave</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong>FOKUS X E-Summit 2026</strong> · 18th–20th March 2026
              </span>
              <Link href="/events" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                View Summit Details →
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/events" className="btn btn-primary" style={{ fontSize: 14, padding: '12px 24px' }}>
                Explore Events &amp; Initiatives
              </Link>
              <Link href="/about" className="btn" style={{ fontSize: 14, padding: '12px 20px' }}>
                About EDC &amp; AIIH
              </Link>
              <Link href="/contact" className="btn" style={{ fontSize: 14, padding: '12px 20px' }}>
                Partner With Us
              </Link>
            </div>
          </div>

          {/* Institutional Reach Ledger — Light Surface */}
          <aside style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: '24px 28px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', marginBottom: 14, borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 8 }}>
              EDC Ecosystem Snapshot
            </div>
            {[
              { label: 'Audience Reach', value: '2 Lakh+' },
              { label: 'Community Following', value: '5,000+' },
              { label: 'Operational Divisions', value: '12 Teams' },
              { label: 'VC & Angel Partners', value: '15+' },
              { label: 'Regional Transit Network', value: '4 Cities' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* Flagship Event Spotlight — E-Summit 2026 */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ padding: 'clamp(24px, 4vw, 36px)', background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-block' }}>
                Annual Flagship Conclave
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
            Presented by EDC AITR and AIIH Foundation, E-Summit is Central India&apos;s premier student entrepreneurship conclave. Featuring live venture pitching at <strong>PitchBiz</strong>, Creator&apos;s Connect 2.0, hands-on masterclasses, and eminent keynote dialogues.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: 'var(--surface-subtle)', padding: '18px', borderRadius: 'var(--radius-card)', marginBottom: 24 }}>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>PitchBiz Desk</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live VC &amp; Angel pitch track</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>Creator&apos;s Connect 2.0</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fireside talks with top founders</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>Transit Network</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Indore · Dewas · Ujjain · Maksi</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13 }}>12 Execution Teams</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Student operational management</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/events" className="btn btn-primary" style={{ fontSize: 13 }}>
              Explore Summit Details &amp; Passes →
            </Link>
            <Link href="/contact" className="btn" style={{ fontSize: 13 }}>
              Sponsor Tracks &amp; Stalls
            </Link>
          </div>
        </div>
      </section>

      {/* Core Institutional Pillars — What EDC AITR Does */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            What We Do
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            Core Pillars of EDC AITR
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 620, fontSize: 14 }}>
            Year-round operational frameworks and incubation support designed to turn academic engineering talent into validated market ventures.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {CORE_PILLARS.map((p) => (
            <article key={p.title} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '26px 22px' }}>
              <span className="badge badge-accent" style={{ width: 'fit-content', marginBottom: 12 }}>
                {p.badge}
              </span>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 700 }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {p.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Past Keynote Speakers & Luminaries Hosted by EDC */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Eminent Voices
            </h2>
            <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
              Distinguished Guests Hosted by EDC
            </div>
          </div>
          <span className="stamp-label">
            <span className="stamp-dot" />
            Acropolis Dignitaries &amp; Mentors
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

      {/* EDC Event Portfolio & Legacy */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Legacy &amp; Conclaves
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            The EDC AITR Event Portfolio
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 620, fontSize: 14 }}>
            From national-level hackathons and TED conferences to institutional meets and statewide summits.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PAST_MEGA_EVENTS.map((ev) => (
            <div key={ev.title} className="card" style={{ padding: '22px' }}>
              <span className="badge" style={{ marginBottom: 8 }}>EDC Initiative</span>
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
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Student Execution Engine
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            The 12 Operational Teams Powering EDC
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 600, fontSize: 14 }}>
            Every summit, hackathon, and campus initiative is driven by student-led operational teams with verified responsibilities under the Director and faculty advisors.
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
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: 0, borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
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
        <p style={{ fontSize: 11, letterSpacing: '0.02em', color: 'var(--text-muted)', marginBottom: 10 }}>
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
