import Link from 'next/link';
import { getPublicPastTeams, getPublicTeamProfiles } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

const ROLE_TITLES: Record<'director' | 'advisor' | 'core_team', string> = {
  director: 'Director',
  advisor: 'Advisors',
  core_team: 'Core Team',
};

const SUMMIT_COORDINATORS = [
  {
    name: 'Kavyansh Singh Rajput',
    role: 'Lead Coordinator',
    phone: '+91 8839988997',
    email: 'kavyanshsinghrajput@gmail.com',
  },
  {
    name: 'Pradhyumn Mehta',
    role: 'Event Coordinator',
    phone: '+91 8770527096',
    email: 'pradhyumnmehta231355@acropolis.in',
  },
  {
    name: 'Ishaan Dadoo',
    role: 'Operations Coordinator',
    phone: '+91 6232400399',
    email: 'ishaandadoo230858@acropolis.in',
  },
  {
    name: 'Prince Joshi',
    role: 'Corporate & Media Coordinator',
    phone: '+91 8209657305',
    email: 'princejoshi0290@gmail.com',
  },
];

const OPERATIONAL_UNITS = [
  { code: 'RD', name: 'Research & Development', focus: 'Ecosystem analysis, challenge design, problem statement formulation' },
  { code: 'AV', name: 'Audio / Visual', focus: 'Live feeds, sound engineering, auditorium projection, stage lighting' },
  { code: 'STAGE', name: 'Stage Management', focus: 'Run-of-show orchestration, dignitary cueing, ceremonial protocol' },
  { code: 'LOGISTICS', name: 'Logistics', focus: 'Inventory delivery, venue equipment, procurement, transport' },
  { code: 'CROWD', name: 'Crowd Control', focus: 'Check-in turnstiles, auditorium seating flow, security & safety' },
  { code: 'CLIX', name: 'CLIX (Photo & Media)', focus: 'High-res photography, media capture, reels & archival footage' },
  { code: 'GUEST', name: 'Guest Relations', focus: 'Keynote dignitary protocol, travel escort, green-room hospitality' },
  { code: 'DOCS', name: 'Documentation', focus: 'Post-event reporting, government scheme alignment, institutional MoUs' },
  { code: 'ANCHORING', name: 'Anchoring', focus: 'Stage hosts, debate moderators, panel emcees, crowd engagement' },
  { code: 'DESIGN', name: 'Design & Visual Identity', focus: 'Brand identity, stage wraps, credential badges, promotional banners' },
  { code: 'VIDEO', name: 'Video Production', focus: 'Cinematic recaps, speaker teasers, interview series, live streams' },
  { code: 'SOCIAL', name: 'Social Media & Outreach', focus: 'Real-time coverage on @edc_acropolis, press & campus ambassadors' },
];

export default async function TeamPage() {
  const [currentTeam, pastTeam] = await Promise.all([
    getPublicTeamProfiles(),
    getPublicPastTeams(),
  ]);

  const groups: ('director' | 'advisor' | 'core_team')[] = ['director', 'advisor', 'core_team'];

  return (
    <div style={{ display: 'grid', gap: 56 }}>
      {/* Light Header Band */}
      <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(32px, 4vw, 48px)', margin: 0 }}>
        <div style={{ maxWidth: 1100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
              EDC AITR &amp; AIIH Foundation
            </span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
            Leadership &amp; Execution Team
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, lineHeight: 1.65 }}>
            Meet the student coordinators, faculty advisors, and 12 operational teams driving the entrepreneurship movement at Acropolis Institute of Technology and Research.
          </p>
        </div>
      </section>

      {/* Flagship Coordinators (Brochure verified) */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Central Leadership
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            Lead Coordinators
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {SUMMIT_COORDINATORS.map((c) => (
            <article key={c.name} className="card" style={{ padding: '24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', border: '1px solid rgba(224,72,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', marginBottom: 14 }}>
                {c.name.charAt(0)}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h3>
              <p className="badge badge-accent" style={{ margin: '0 0 14px', width: 'fit-content' }}>
                {c.role}
              </p>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'grid', gap: 4 }}>
                <div><strong>Phone:</strong> {c.phone}</div>
                <div style={{ wordBreak: 'break-all' }}><strong>Email:</strong> {c.email}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Database Registered Team (Director, Advisors, Core Team) */}
      {currentTeam.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {groups.map((roleKey) => {
            const members = currentTeam.filter((m) => m.role === roleKey);
            if (members.length === 0) return null;
            return (
              <div key={roleKey} style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
                  {ROLE_TITLES[roleKey]}
                </h2>
                <div className="grid">
                  {members.map((member) => {
                    const avatarUrl = getImageKitUrl(member.avatar_ref);
                    return (
                      <article key={member.id} className="card">
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={member.full_name} className="avatar" />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-3-accent-personality)', flexShrink: 0 }}>
                              {(member.full_name || 'E').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                              {member.full_name || 'EDC Member'}
                            </h3>
                            <p className="card-meta" style={{ margin: 0 }}>
                              {member.designation || ROLE_TITLES[roleKey]}
                            </p>
                          </div>
                        </div>
                        {member.bio && (
                          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {member.bio}
                          </p>
                        )}
                        {member.linkedin_url && (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                              <rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
                            </svg>
                            LinkedIn Profile
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 12 Operational Units Reference */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Operational Hierarchy
          </h2>
          <div style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 800 }}>
            The 12 Operational Teams
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 640 }}>
            Each team is headed by approved student coordinators with clear task assignments and accountability under the Director and Advisors.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {OPERATIONAL_UNITS.map((u) => (
            <div key={u.code} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="mono-meta" style={{ fontWeight: 700, color: 'var(--color-3-accent-personality)', background: 'var(--accent-tint)', padding: '2px 8px', borderRadius: 4 }}>
                  {u.code}
                </span>
                <strong style={{ fontSize: 14 }}>{u.name}</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {u.focus}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Past Team & Alumni */}
      {pastTeam && pastTeam.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 8px', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
              Alumni Roster
            </h2>
            <div style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800 }}>
              Past Core Team Members
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {pastTeam.map((m) => (
              <div key={m.full_name} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', border: '1px solid var(--border-hairline)', borderRadius: 32, background: 'var(--surface)', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{m.full_name || 'Alumni'}</span>
                {m.designation && <span className="card-meta" style={{ margin: 0 }}>· {m.designation}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Join Call to Action */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%', textAlign: 'center', background: 'var(--surface-subtle)', padding: '48px 24px', borderRadius: 'var(--radius-panel)', border: '1px solid var(--border-hairline)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.6rem', fontWeight: 800 }}>
          Want to Lead at EDC AITR?
        </h2>
        <p style={{ margin: '0 auto 24px', maxWidth: 480, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Applications for Core Team membership across the 12 operational teams open each semester. Every tenure is officially recorded on the institutional registry.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/account" className="btn btn-primary">
            Apply for Core Team
          </Link>
          <Link href="/contact" className="btn">
            Contact Leads
          </Link>
        </div>
      </section>
    </div>
  );
}
