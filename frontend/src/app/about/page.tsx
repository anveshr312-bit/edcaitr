import Link from 'next/link';
import type { Metadata } from 'next';
import { createPageMetadata } from '../../lib/seo';
import { BreadcrumbStructuredData } from '../../components/StructuredData';

export const metadata: Metadata = createPageMetadata({
  title: 'About Us — Mission, Leadership & Incubation Hub',
  description: 'Learn about EDC AITR and the AIIH Foundation at Acropolis Institute of Technology & Research, empowering student founders through mentorship, venture grants, and startup acceleration.',
  path: '/about',
  keywords: [
    'About EDC AITR',
    'AIIH Foundation Acropolis',
    'Acropolis Incubation Hub',
    'Student entrepreneurship mission Indore',
    'E-Cell objectives Acropolis',
  ],
});

export default function AboutPage() {
  const OBJECTIVES = [
    {
      num: '01',
      title: 'Promote Innovation Culture',
      desc: 'Foster an active problem-solving and venture-building mindset among student innovators across Madhya Pradesh.',
    },
    {
      num: '02',
      title: 'Startup Pitching & Discovery',
      desc: 'Provide tangible platforms like PitchBiz to showcase student prototypes directly before verified Angel Networks and VCs.',
    },
    {
      num: '03',
      title: 'Ecosystem & Mentor Access',
      desc: 'Facilitate direct, ongoing engagement with industry CXOs, startup founders, legal consultants, and institutional advisors.',
    },
    {
      num: '04',
      title: 'Government Scheme Awareness',
      desc: 'Connect budding founders with MP state and central government grant opportunities, incubation schemes, and DPIIT incentives.',
    },
    {
      num: '05',
      title: 'Institutional Incubation Support',
      desc: 'Partner closely with AIIH Foundation at Acropolis to provide pre-incubation, prototyping lab access, and seed support.',
    },
  ];

  const IMPACT_STATS = [
    { label: 'Audience Reach', value: '2 Lakh+' },
    { label: 'Community Following', value: '5,000+' },
    { label: 'Operational Teams', value: '12' },
    { label: 'VC & Angel Partners', value: '15+' },
  ];

  return (
    <div style={{ display: 'grid', gap: 56 }}>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'About EDC & AIIH', path: '/about' },
        ]}
      />
      {/* Light Header Band */}
      <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(32px, 4vw, 48px)', margin: 0 }}>
        <div style={{ maxWidth: 1100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
              Acropolis Group of Institutions
            </span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
            About EDC AITR
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, lineHeight: 1.65 }}>
            The Entrepreneurship Development Cell (EDC) &amp; AIIH Foundation at Acropolis Institute of Technology and Research, Indore.
          </p>
        </div>
      </section>

      {/* Purpose & Mission Narrative */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 1fr)', gap: 40, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 12px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Our Mission
            </h2>
            <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800, marginBottom: 20 }}>
              Bridging the Gap Between Industry &amp; Academia
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: 16 }}>
              The Entrepreneurship Development Cell (EDC), in partnership with the <strong>AIIH Foundation</strong> (Acropolis Institutional Incubation Hub), serves as a dynamic platform for aspiring entrepreneurs to create measurable, real-world impact.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Unlike one-off student clubs, EDC AITR operates through structured operational divisions, institutional governance, and official tenure tracking. We bring together venture capitalists, angel investors, startup CXOs, and student innovators through flagship conclaves like <strong>E-Summit</strong>, <strong>Kriyeta</strong>, and <strong>TEDx</strong>.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
              From pre-incubation and prototype evaluations to hosting statewide summits with over 2 Lakh+ student reach, EDC AITR turns classroom curiosity into venture execution.
            </p>
          </div>

          {/* Quick Metrics Aside */}
          <aside className="card" style={{ padding: '28px 24px', background: 'var(--surface-subtle)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Ecosystem Numbers
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {IMPACT_STATS.map((s) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 10 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--color-3-accent-personality)' }}>{s.value}</strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Active transit network connecting students across Indore, Dewas, Ujjain, and Maksi via Acropolis institutional transit.
            </div>
          </aside>
        </div>
      </section>

      {/* 5 Core Objectives (Brochure verified) */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Strategic Framework
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            Five Objectives Driving Our Work
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {OBJECTIVES.map((o) => (
            <div key={o.num} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-3-accent-personality)', marginBottom: 8, opacity: 0.9 }}>
                {o.num}
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>{o.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {o.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Anatomy: 3 Domains Breakdown */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Operational Anatomy
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            The 3 Operating Domains
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 680, lineHeight: 1.6 }}>
            Every active core member and operational workflow in EDC AITR is organized across three foundational pillars, driving research-backed intelligence, flawless conclave experiences, and strategic ecosystem alliances.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Domain 1: Research & Digital Communications */}
          <div
            className="card"
            style={{
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-panel)',
              background: 'var(--surface)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(192, 30, 48, 0.08)', color: 'var(--color-3-accent-personality)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Pillar 01 · Knowledge &amp; Media
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Research &amp; Digital Communications
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Synthesizing founder intelligence, analyzing emerging market sectors, and directing all creative, cinematic, and digital touchpoints across campus and social media.
              </p>

              <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 16, display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Market &amp; Venture Research
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Problem statement curation, investor market briefs, government scheme radars, and founder case studies.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Design &amp; Brand Systems
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Conclave stage wraps, delegate passes, digital banners, editorial layouts, and typography systems.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    CLIX, Media &amp; Video Production
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Cinematic aftermovies, speaker interview podcasts, live photography archives, and dynamic reels.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Editorial &amp; Outreach Strategy
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Official documentation, governance records, campus ambassador network, and social outreach (@edc_acropolis).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain 2: Programs & Experiences */}
          <div
            className="card"
            style={{
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-panel)',
              background: 'var(--surface)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(192, 30, 48, 0.08)', color: 'var(--color-3-accent-personality)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Pillar 02 · Conclaves &amp; Production
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Programs &amp; Experiences
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Architecting flagship hackathons, masterclasses, and investor summits with rigorous stage management, audio-visual excellence, and seamless gate flow.
              </p>

              <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 16, display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Hackathons &amp; Pitch Competitions
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Kriyeta hackathon framework, PitchBiz investor arenas, judge scoring rubrics, and prototype tracks.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Stage Management &amp; Emceeing
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Dignitary cueing, run-of-show synchronization, professional anchoring, and fireside keynotes.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Audio / Visual (AV) Engineering
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Multi-feed projection, auditorium acoustics, live streaming consoles, and atmospheric stage lighting.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Gate &amp; Crowd Logistics
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    QR delegate pass check-in, turnstile safety protocols, venue apparatus staging, and vendor coordination.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain 3: Partnerships & Ecosystem Relations */}
          <div
            className="card"
            style={{
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-panel)',
              background: 'var(--surface)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(192, 30, 48, 0.08)', color: 'var(--color-3-accent-personality)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Pillar 03 · Alliances &amp; Capital
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Partnerships &amp; Ecosystem Relations
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Forging long-term corporate sponsorships, angel syndicate ties, institutional MoUs, and managing high-trust VIP dignitary hospitality.
              </p>

              <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 16, display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Corporate Sponsorships &amp; Grants
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Venture title sponsorships, prize pool underwriting, brand booth fulfillment, and corporate deliverables.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Institutional Alliances &amp; MoUs
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Incubator MoUs via AIIH Foundation, chamber of commerce partnerships, and national accelerator conduits.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Guest Protocol &amp; Hospitality
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    VIP keynote speakers, angel investor hosting, transit logistics, green room protocol, and felicitation.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Alumni Founder Network
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Startup founder mentorship circles, investment syndication, and graduate career referrals.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Footer */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link href="/events" className="btn btn-primary">
          Browse Events &amp; E-Summit
        </Link>
        <Link href="/team" className="btn">
          Meet Leadership &amp; Teams
        </Link>
        <Link href="/contact" className="btn">
          Contact &amp; Partnerships
        </Link>
      </section>
    </div>
  );
}
