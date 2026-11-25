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
      <h1>Team</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Approved E-Cell AITR leadership and Core Team members with public visibility enabled.
      </p>

      {currentTeam.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No team profiles are currently set to public visibility. Approved members can enable
            visibility from their Account Profile.
          </p>
        </div>
      ) : (
        groups.map((roleKey) => {
          const members = currentTeam.filter((m) => m.role === roleKey);
          if (members.length === 0) return null;

          return (
            <section key={roleKey}>
              <h2>{ROLE_TITLES[roleKey]}</h2>
              <div className="grid">
                {members.map((member) => {
                  const avatarUrl = getImageKitUrl(member.avatar_ref);
                  return (
                    <article key={member.id} className="card">
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        {avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt={member.full_name} className="avatar" />
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                            {member.full_name || 'E-Cell Member'}
                          </h3>
                          <p className="card-meta" style={{ margin: 0 }}>
                            {member.designation || ROLE_TITLES[roleKey]}
                          </p>
                        </div>
                      </div>
                      {member.bio && <p className="card-meta" style={{ margin: 0 }}>{member.bio}</p>}
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
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

      {pastTeam.length > 0 && (
        <section>
          <h2>Past Teams</h2>
          <div className="grid">
            {pastTeam.map((member, idx) => (
              <article key={`${member.full_name}-${idx}`} className="card">
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{member.full_name}</h3>
                <p className="card-meta" style={{ margin: 0 }}>
                  {member.designation || member.role.replace('_', ' ')}
                </p>
                <p className="mono-meta" style={{ margin: 0 }}>
                  {member.effective_from ?? ''} – {member.effective_until ?? 'Present'}
                </p>
                {member.linkedin_url && (
                  <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <p style={{ marginTop: 32 }}>
        <Link href="/account">Member sign in</Link>
      </p>
    </>
  );
}
