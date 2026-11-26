import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicEvents } from '../lib/events/events';
import { createPageMetadata, SITE_CONFIG } from '../lib/seo';
import {
  HomeSpeakersSection,
  HomeAccordionSection,
  HomePartnersSection,
} from '../components/home/HomeElevatedSections';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.shortDescription,
  path: '/',
  keywords: [
    'EDC AITR Homepage',
    'Acropolis Entrepreneurship Development Cell',
    'Student startups Indore',
    'Central India E-Summit',
    'Venture incubation Acropolis',
  ],
});

export default async function HomePage() {
  const events = await getPublicEvents(false);
  const activeEvents = events.filter((e) => e.status === 'published' || e.status === 'ongoing');

  /* Core Initiatives inspired by premier collegiate E-Cell architectures (e.g. E-Cell IITG) */
  const INITIATIVES = [
    {
      code: 'SUMMIT',
      title: 'E-Summit (Annual Conclave)',
      tag: 'Flagship Conclave',
      desc: 'Central India’s premier youth entrepreneurship summit uniting 2 Lakh+ students, prominent Indian founders, and angel networks for venture showcases, keynotes, and firesides.',
      link: '/events',
      cta: 'Explore Summit',
    },
    {
      code: 'PITCHBIZ',
      title: 'PitchBiz Investment Arena',
      tag: 'Funding & Capital',
      desc: 'Live venture pitch track connecting student innovators with verified Angel Networks and VCs (Lead Angels, TiE, MP Angel Network) to secure early-stage seed funding.',
      link: '/events',
      cta: 'Pitch Details',
    },
    {
      code: 'CSI',
      title: 'Campus Startup Initiative (CSI)',
      tag: 'Pre-Incubation',
      desc: 'An 8-month structured sprint with the AIIH Foundation providing prototyping labs, cloud credits, and grant pipelines (DPIIT, MP Startup Policy, NIDHI-EIR).',
      link: '/about',
      cta: 'Venture Support',
    },
    {
      code: 'KRIYETA',
      title: 'Kriyeta National Hackathon',
      tag: 'Innovation Sprint',
      desc: 'A 48-hour high-intensity national build sprint turning industrial and real-world problem statements into working hardware and software prototypes.',
      link: '/events',
      cta: 'Hackathon Track',
    },
    {
      code: 'MASTERS',
      title: 'Founder Masterclasses & PMx',
      tag: 'Skill & Product',
      desc: 'Hands-on bootcamps on unit economics, legal term sheets, go-to-market mechanics, and product management led by active operators and founders.',
      link: '/about',
      cta: 'Masterclasses',
    },
    {
      code: 'TEDX',
      title: 'TEDx & Disruptive Dialogues',
      tag: 'Ideas & Media',
      desc: 'Independently organized TED conferences and lit-fests celebrating breakthrough ideas, design thinking, and transformative cultural narratives.',
      link: '/events',
      cta: 'Conferences',
    },
  ];

  /* Notable figures & founders hosted */
  const PAST_SPEAKERS = [
    { name: 'Piyush Mishra', role: 'Poet, Lyricist, Actor & Singer', tag: 'Cultural Icon' },
    { name: 'Chandubhai Virani', role: 'Founder & Chairman, Balaji Wafers', tag: 'D2C Pioneer' },
    { name: 'Siddharth Dungarwal', role: 'Founder, Snitch', tag: 'D2C Unicorn' },
    { name: 'Sunita Rajwar', role: 'Actor (Gullak, Panchayat, Cinema & Theatre)', tag: 'Cinema & Arts' },
    { name: 'Abhishek Kar', role: 'Stock Market Strategist & Creator', tag: 'Finance' },
    { name: 'Laxmi Narayan Tripathi', role: 'Author, Activist & Human Rights Leader', tag: 'Thought Leader' },
    { name: 'Ridhima Arora', role: 'Founder, Namhya Foods (Shark Tank India)', tag: 'FMCG & Wellness' },
    { name: 'Shreyaan Daga', role: 'Founder, OLL (Youngest Shark Tank Founder)', tag: 'EdTech' },
  ];

  /* Institutional backing & partner organisations */
  const BACKING_ORGANISATIONS = [
    { name: 'AIIH Foundation', type: 'Incubation & Seed Partner', desc: 'Acropolis Institutional Incubation Hub' },
    { name: 'TiE Madhya Pradesh', type: 'Ecosystem Partner', desc: 'The Indus Entrepreneurs' },
    { name: 'Lead Angels Network', type: 'Investment Partner', desc: 'National Angel Syndicate' },
    { name: 'MP Angel Network', type: 'Regional Seed Partner', desc: 'Statewide Angel Investor Network' },
    { name: 'IIC (Ministry of Education)', type: 'Institutional Framework', desc: 'MoE Innovation Cell' },
    { name: 'Headstart Network', type: 'Community Partner', desc: 'Grassroots Startup Ecosystem' },
  ];

  /* 12 Operational Teams */
  const OPERATIONAL_TEAMS = [
    { code: 'RD', name: 'Research & Development', desc: 'Problem statements, hackathon frameworks & ecosystem intelligence.' },
    { code: 'AV', name: 'Audio / Visual', desc: 'Sound engineering, live feeds, lighting & auditorium stage tech.' },
    { code: 'STAGE', name: 'Stage Management', desc: 'Dignitary cueing, run-of-show & on-stage operations.' },
    { code: 'LOGISTICS', name: 'Logistics', desc: 'Equipment movement, inventory & vendor delivery.' },
    { code: 'CROWD', name: 'Crowd Control', desc: 'Auditorium flow, access zones & perimeter management.' },
    { code: 'CLIX', name: 'CLIX (Photo & Media)', desc: 'Official event photography, session documentation & reels.' },
    { code: 'GUEST', name: 'Guest Relations', desc: 'Hospitality, transport & protocol for keynote speakers.' },
    { code: 'DOCS', name: 'Documentation', desc: 'Official MoUs, post-event analytics & compliance.' },
    { code: 'ANCHORING', name: 'Anchoring', desc: 'Stage hosts, session moderators & emcees.' },
    { code: 'DESIGN', name: 'Design & Visual Identity', desc: 'Banners, stage backdrops, passes & digital collateral.' },
    { code: 'VIDEO', name: 'Video Production', desc: 'Recap films, live broadcasts & promo campaigns.' },
    { code: 'SOCIAL', name: 'Social Media & Outreach', desc: 'Real-time coverage on @edc_acropolis & viral engagement.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 64 }}>
      {/* ─── 1. HERO SECTION ─── */}
      <section
        className="card"
        style={{
          padding: 'clamp(36px, 5vw, 56px)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-panel)',
          background: 'var(--surface)',
          margin: 0,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 1fr)', gap: 40, alignItems: 'center' }}>
          <div>
            {/* Institutional Header Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 32,
                background: 'var(--accent-tint)',
                border: '1px solid rgba(192, 30, 48, 0.2)',
                marginBottom: 18,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
                Entrepreneurship Development Cell · Acropolis Indore
              </span>
            </div>

            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
              }}
            >
              Empowering the Next Wave of Student Founders.
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: 'clamp(1rem, 1.3vw, 1.15rem)', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.45 }}>
              We accelerate campus startups while equipping students with the venture skills, investor networks, and operational mastery to lead them.
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 540 }}>
              Operating in formal partnership with the <strong>AIIH Foundation</strong> (Acropolis Institutional Incubation Hub), EDC AITR turns engineering intellect into validated market enterprises across Central India.
            </p>

            {/* Upcoming Conclave Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-control)',
                marginBottom: 24,
                flexWrap: 'wrap',
              }}
            >
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
                Explore Initiatives &amp; Events
              </Link>
              <Link href="/about" className="btn" style={{ fontSize: 14, padding: '12px 20px' }}>
                About EDC &amp; AIIH
              </Link>
              <Link href="/contact" className="btn" style={{ fontSize: 14, padding: '12px 20px' }}>
                Partner With Us
              </Link>
            </div>
          </div>

          {/* Numbers That We Hit — Metric Ledger Aside */}
          <aside
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-card)',
              padding: '24px 28px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'var(--text-muted)',
                marginBottom: 14,
                borderLeft: '3px solid var(--color-3-accent-personality)',
                paddingLeft: 8,
              }}
            >
              Numbers That We Hit
            </div>
            {[
              { label: 'Audience Reach', value: '2 Lakh+' },
              { label: 'Startups Supported', value: '50+' },
              { label: 'Grants & Funding Pipeline', value: '₹1.5 Cr+' },
              { label: 'Marquee Speakers & Founders', value: '45+' },
              { label: 'Operational Divisions', value: '12 Teams' },
              { label: 'Transit Network Coverage', value: '4 Cities' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* ─── 2. OUR INITIATIVES (Inspired by E-Cell IITG) ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-muted)',
              margin: '0 0 8px',
              borderLeft: '3px solid var(--color-3-accent-personality)',
              paddingLeft: 12,
            }}
          >
            What We Do
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)', fontWeight: 800 }}>
            Our Initiatives
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 640, fontSize: 14, lineHeight: 1.6 }}>
            Year-round platforms designed to seed innovation, accelerate prototypes, and connect student entrepreneurs directly with industry capital.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
          {INITIATIVES.map((item) => (
            <article
              key={item.title}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-accent" style={{ fontSize: 11 }}>
                  {item.tag}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {item.code}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700 }}>
                {item.title}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, flexGrow: 1 }}>
                {item.desc}
              </p>
              <Link
                href={item.link}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-3-accent-personality)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {item.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ─── 3. CAMPUS STARTUP INITIATIVE (Deep-Dive Pre-Incubation) ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div
          className="card"
          style={{
            padding: 'clamp(28px, 4vw, 40px)',
            background: 'var(--surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-panel)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-block' }}>
                Pre-Incubation Sprint
              </span>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
                Campus Startup Initiative (CSI)
              </h2>
              <p className="mono-meta" style={{ margin: '6px 0 0', fontSize: 13 }}>
                In partnership with AIIH Foundation · Acropolis Institutional Incubation Hub
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-3-accent-personality)' }}>
                8 Months
              </div>
              <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Structured Venture Program</div>
            </div>
          </div>

          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 840 }}>
            A structured full-year sprint designed for student founders of Acropolis. We bridge academic coursework with market validation through proof-of-concept grants, fablab rapid prototyping, customer discovery sprints, and investor pitch clinics.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 14,
              background: 'var(--surface-subtle)',
              padding: '20px',
              borderRadius: 'var(--radius-card)',
              marginBottom: 24,
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>₹1.5 Cr+ Pipeline</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>DPIIT, MP Startup Policy &amp; NIDHI-EIR grants</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>Prototyping Labs</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AIIH FabLabs, IoT racks &amp; 3D printing suites</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>Cloud &amp; Tool Credits</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AWS, GitHub Enterprise &amp; Google Cloud perks</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>1-on-1 Founder Mentors</strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Dedicated CXOs &amp; institutional advisors</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/about" className="btn btn-primary" style={{ fontSize: 13 }}>
              Apply for CSI Pre-Incubation →
            </Link>
            <Link href="/contact" className="btn" style={{ fontSize: 13 }}>
              Mentor a Campus Venture
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3.5. ACCORDION GALLERY (Campus & Summit Architecture) ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <HomeAccordionSection />
      </section>

      {/* ─── 4. GUESTS WE HOSTED (Interactive 3D Coverflow Speaker Archive) ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <HomeSpeakersSection />
      </section>

      {/* ─── 5. ORGANISATIONS THAT BACK US ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-muted)',
              margin: '0 0 8px',
              borderLeft: '3px solid var(--color-3-accent-personality)',
              paddingLeft: 12,
            }}
          >
            Institutional Ecosystem
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', fontWeight: 800 }}>
            Organisations That Back Us
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 620, fontSize: 14 }}>
            Direct partnerships with official incubation hubs, national angel syndicates, and government innovation frameworks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {BACKING_ORGANISATIONS.map((org) => (
            <div key={org.name} className="card" style={{ padding: '20px', background: 'var(--surface)' }}>
              <span className="badge badge-accent" style={{ marginBottom: 8, width: 'fit-content', fontSize: 11 }}>
                {org.type}
              </span>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>
                {org.name}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {org.desc}
              </p>
            </div>
          ))}
        </div>

        <HomePartnersSection />
      </section>

      {/* ─── 6. THE 12 OPERATIONAL DIVISIONS ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-muted)',
              margin: '0 0 8px',
              borderLeft: '3px solid var(--color-3-accent-personality)',
              paddingLeft: 12,
            }}
          >
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
            <div key={t.code} className="card" style={{ padding: '16px 18px', background: 'var(--surface)' }}>
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

      {/* ─── 7. ACTIVE CALENDAR EVENTS (From DB) ─── */}
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
              <article key={ev.id} className="card" style={{ background: 'var(--surface)' }}>
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

      {/* ─── 8. REACH OUT TO US (Structured Intake) ─── */}
      <section
        className="card"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-panel)',
          padding: '48px clamp(16px, 4vw, 48px)',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 32,
              background: 'var(--accent-tint)',
              border: '1px solid rgba(192, 30, 48, 0.2)',
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
              Get Involved · Connect With EDC AITR
            </span>
          </div>

          <h2 style={{ margin: '0 auto 14px', fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 800, lineHeight: 1.2 }}>
            Reach Out to Us
          </h2>
          <p style={{ margin: '0 auto 32px', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
            Whether you are a student founder seeking grant incubation, an enterprise looking to sponsor conclaves, or a passionate builder wanting to join the operational teams.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, textAlign: 'left', marginBottom: 32 }}>
            <div style={{ padding: '18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>For Student Founders</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Get prototype evaluation, grant support, and pitch directly at PitchBiz.
              </p>
              <Link href="/about" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                CSI Details →
              </Link>
            </div>

            <div style={{ padding: '18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>For Partners &amp; VCs</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Sponsor conclave tracks, judge hackathons, and evaluate venture dealflow.
              </p>
              <Link href="/contact" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                Partner Desk →
              </Link>
            </div>

            <div style={{ padding: '18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>For Student Leaders</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Apply to join one of the 12 student execution divisions.
              </p>
              <Link href="/account" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                Join the Team →
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://www.instagram.com/edc_acropolis"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 14, padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Follow @edc_acropolis
            </a>
            <Link href="/contact" className="btn" style={{ fontSize: 14, padding: '12px 22px' }}>
              Contact EDC Secretariat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
