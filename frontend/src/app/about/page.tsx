import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      {/* Dark header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '48px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>EDC AITR</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, lineHeight: 1.1 }}>About Us</h1>
        <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 600 }}>
          The Entrepreneurship Development Cell (EDC) at Acropolis Institute of Technology &amp; Research.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 56, maxWidth: 820, marginTop: 48 }}>
        {/* Mission */}
        <section>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Our Purpose
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 'clamp(1rem,1.5vw,1.1rem)', lineHeight: 1.75, color: 'var(--text-primary)' }}>
            EDC AITR empowers students to explore startup building, product thinking, and leadership
            through real-world execution. Unlike one-off campus clubs, we welcome students across
            colleges, external founders, startup representatives, and alumni into structured events,
            mentorship sessions, and operational teams.
          </p>
          <p style={{ margin: 0, fontSize: 'clamp(1rem,1.5vw,1.1rem)', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
            Every event at EDC AITR is built by a team — 12 specialized operational units working
            together on logistics, design, registrations, documentation, and more. That operational
            experience is what turns participants into builders.
          </p>
        </section>

        {/* Pillars grid */}
        <section>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            What We Stand For
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2, background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }}>
            {[
              {
                title: 'Leadership & Governance',
                body: 'Guided by the Director and Advisors, with Core Team members leading event execution across 12 specialized operational teams.',
              },
              {
                title: 'Verified Continuity',
                body: "Every team member's tenure and contribution is preserved. Departing members transition into the verified Alumni Connect network.",
              },
              {
                title: 'Open Participation',
                body: 'Events are open to students, external founders, and startup representatives — not just AITR students.',
              },
              {
                title: 'Practical Execution',
                body: 'From QR check-in to task boards to certificate issuance — everything runs through a structured, accountable system.',
              },
            ].map(({ title, body }) => (
              <div key={title} style={{ background: 'var(--surface)', padding: '28px 24px', display: 'grid', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The 12 teams */}
        <section>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Our 12 Operational Teams
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Research & Development (RD)', 'Audio/Visual (AV)', 'Stage', 'Logistics', 'Crowd Management', 'CLIX', 'Guest Relations', 'Documentation', 'Anchoring', 'Design', 'Video', 'Social Media'].map(team => (
              <span key={team} style={{ display: 'inline-block', padding: '6px 14px', border: '1px solid var(--border-hairline)', borderRadius: 32, fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 500 }}>
                {team}
              </span>
            ))}
          </div>
        </section>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/team" className="btn btn-primary">Meet the Team</Link>
          <Link href="/contact" className="btn">Contact Us</Link>
          <Link href="/events" className="btn">Browse Events</Link>
        </div>
      </div>
    </>
  );
}
