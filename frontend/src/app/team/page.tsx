import Link from 'next/link';
import { getPublicPastTeams, getPublicTeamProfiles } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

const ROLE_TITLES: Record<'director' | 'advisor' | 'core_team', string> = {
  director: 'Director',
  advisor: 'Advisors',
  core_team: 'Core Team',
};

export default async function TeamPage() {
  const [currentTeam, pastTeam] = await Promise.all([
    getPublicTeamProfiles(),
    getPublicPastTeams(),
  ]);

  const groups: ('director' | 'advisor' | 'core_team')[] = ['director', 'advisor', 'core_team'];

  return (
    <>
      {/* Dark header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '48px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>EDC AITR</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, lineHeight: 1.1 }}>The Team</h1>
        <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 540 }}>
          Approved leadership and Core Team members with public visibility enabled.
          Alumni who opt in are shown in the past-team section below.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 56, marginTop: 48 }}>
        {currentTeam.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              No team profiles are currently set to public visibility.
              Approved members can enable visibility from their Account Profile.
            </p>
          </div>
        ) : (
          groups.map((roleKey) => {
            const members = currentTeam.filter((m) => m.role === roleKey);
            if (members.length === 0) return null;
            return (
              <section key={roleKey}>
                <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
                  {ROLE_TITLES[roleKey]}
                </h2>
                <div className="grid">
                  {members.map((member) => {
                    const avatarUrl = getImageKitUrl(member.avatar_ref);
                    return (
                      <article key={member.id} className="card">
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={member.full_name} className="avatar" />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-3-accent-personality)', flexShrink: 0 }}>
                              {(member.full_name || 'E').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{member.full_name || 'EDC Member'}</h3>
                            <p className="card-meta" style={{ margin: 0 }}>{member.designation || ROLE_TITLES[roleKey]}</p>
                          </div>
                        </div>
                        {member.bio && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{member.bio}</p>}
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 500 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                              <rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {pastTeam && pastTeam.length > 0 && (
          <section>
            <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
              Past Team Members
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {pastTeam.map((m) => (
                <div key={m.full_name} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', border: '1px solid var(--border-hairline)', borderRadius: 32, background: 'var(--surface)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{m.full_name || 'Alumni'}</span>
                  {m.designation && <span className="card-meta" style={{ margin: 0 }}>{m.designation}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/about" className="btn">About EDC AITR</Link>
          <Link href="/contact" className="btn">Contact Us</Link>
        </div>
      </div>
    </>
  );
}
