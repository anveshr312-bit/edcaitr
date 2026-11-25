import Link from 'next/link';

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
    <div style={{ display: 'grid', gap: 64 }}>
      {/* Header Band */}
      <section style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '56px clamp(16px,4vw,48px)', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>
            Acropolis Group of Institutions
          </p>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.1 }}>
            About EDC AITR
          </h1>
          <p style={{ margin: 0, color: 'rgba(251,249,245,0.7)', fontSize: 16, maxWidth: 640, lineHeight: 1.65 }}>
            The Entrepreneurship Development Cell (EDC) &amp; AIIH Foundation at Acropolis Institute of Technology and Research, Indore.
          </p>
        </div>
      </section>

      {/* Purpose & Mission Narrative */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 1fr)', gap: 40, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
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
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
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

      {/* 12 Operational Teams Breakdown */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Operational Anatomy
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            The 12 Confirmed Teams
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { name: 'Research & Development (RD)', desc: 'Problem curation, hackathon frameworks, judge scoring grids & innovation benchmarks.' },
            { name: 'Audio / Visual (AV)', desc: 'Professional audio mix, live feeds, multi-display projection & stage lighting management.' },
            { name: 'Stage Management', desc: 'Dignitary cueing, run-of-show synchronization & speaker introduction management.' },
            { name: 'Logistics', desc: 'Material procurement, technical apparatus setup, vendor contracts & venue layout.' },
            { name: 'Crowd Management', desc: 'Auditorium flow, QR gate access verification, turnstile flow & safety.' },
            { name: 'CLIX (Photo & Media)', desc: 'High-speed event photography, official session recording, reels & photo archives.' },
            { name: 'Guest Relations', desc: 'VIP dignitary protocol, airport/hotel transit, green-room hospitality & gifting.' },
            { name: 'Documentation', desc: 'Pre-event briefs, post-event analytics, institutional reporting & governance records.' },
            { name: 'Anchoring', desc: 'Stage hosts, keynote emcees, debate moderators & interactive crowd engagement.' },
            { name: 'Design & Visuals', desc: 'Stage wraps, digital promotional collateral, credentials, passes & certificate design.' },
            { name: 'Video Production', desc: 'Aftermovies, teaser promos, founder interviews & cinematic broadcast reels.' },
            { name: 'Social Media & Outreach', desc: 'Live event coverage on @edc_acropolis, press coordination & campus ambassador network.' },
          ].map((t) => (
            <div key={t.name} className="card" style={{ padding: '18px 20px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700 }}>{t.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t.desc}
              </p>
            </div>
          ))}
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
