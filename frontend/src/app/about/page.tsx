import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <h1>About EDC AITR</h1>
      <section className="card">
        <h2>Our Purpose</h2>
        <p>
          The Entrepreneurship Development Cell (EDC) at Acropolis Institute of Technology &amp; Research
          (AITR) empowers students to explore startup building, product thinking, and leadership
          through real-world execution.
        </p>
        <p>
          Unlike one-off campus clubs, EDC AITR welcomes students, external founders, startup
          representatives, and alumni into structured events, mentorship sessions, and operational
          teams.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Leadership &amp; Governance</h3>
          <p className="card-meta">
            Guided by the Director and Advisors, with Core Team members leading event execution across
            12 specialized operational teams.
          </p>
        </article>
        <article className="card">
          <h3>Verified Continuity</h3>
          <p className="card-meta">
            Every team member&apos;s tenure and contribution is preserved, transitioning departing
            members into our verified Alumni network.
          </p>
        </article>
      </section>

      <div className="actions-row">
        <Link href="/team" className="btn btn-primary">
          Meet the Team
        </Link>
        <Link href="/contact" className="btn">
          Contact Us
        </Link>
      </div>
    </>
  );
}
