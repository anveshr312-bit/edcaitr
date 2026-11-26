'use client';

import React, { useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  EyeOff,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { getProjectedMemberProfile } from '../../utils/identityProfile';
import { StudioButton } from '../../components/ui/Primitives';
import { MemberAvatar } from '../../components/identity/MemberAvatar';

export const PublicMemberProfilePage: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { users, currentUser, navigate, startOrOpenConversationWithUser } = usePortal();

  const decodedId = useMemo(() => {
    try {
      return decodeURIComponent(memberId);
    } catch {
      return memberId;
    }
  }, [memberId]);

  const rawTarget = useMemo(
    () => users.find((u) => u.id === decodedId),
    [decodedId, users]
  );

  // Strictly enforce privacy at the data-access boundary
  const projection = useMemo(
    () => getProjectedMemberProfile(rawTarget, currentUser, 'public_route'),
    [currentUser, rawTarget]
  );

  if (!projection.allowed || !projection.profile) {
    const isMembersOnly = projection.reason === 'members_only';
    const isPrivate = projection.reason === 'private';

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="studio-card p-8 sm:p-10 space-y-5">
          <div className="h-11 w-11 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--ink-secondary)]">
            {isMembersOnly ? <Users className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </div>
          <div className="space-y-2">
            <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              EDC AITR · Member Directory
            </p>
            <h1 className="text-2xl font-display font-semibold text-[var(--color-2-mood)]">
              {isMembersOnly
                ? 'Member Profile Restricted to EDC AITR'
                : isPrivate
                  ? 'This Profile Is Private'
                  : 'Member Profile Not Found'}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {isMembersOnly
                ? 'This member has restricted their profile to authenticated EDC AITR members. Sign in with your institutional account to view approved details.'
                : isPrivate
                  ? 'This member has chosen to keep their profile private. No personal details are shared publicly.'
                  : 'We could not locate a public EDC AITR member record matching this address.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border-hairline)]">
            {isMembersOnly && !currentUser && (
              <StudioButton variant="primary" size="sm" onClick={() => navigate('/account')}>
                Sign In to EDC Portal
              </StudioButton>
            )}
            <StudioButton variant="secondary" size="sm" onClick={() => navigate('/team')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>View EDC Leadership</span>
            </StudioButton>
            <StudioButton variant="ghost" size="sm" onClick={() => navigate('/')}>
              Return Home
            </StudioButton>
          </div>
        </div>
      </div>
    );
  }

  const profile = projection.profile;
  const externalLinks = [
    { label: 'LinkedIn', url: profile.linkedin },
    { label: 'Personal Website', url: profile.websiteUrl },
    { label: 'Portfolio', url: profile.portfolioUrl },
    { label: 'GitHub', url: profile.githubUrl },
    { label: 'Company Website', url: profile.companyWebsite },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  return (
    <div className="max-w-[980px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* Top Navigation & Access Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(currentUser ? '/alumni/directory' : '/team')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--color-2-mood)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{currentUser ? 'Back to Member Directory' : 'Back to EDC Team'}</span>
        </button>

        {projection.accessLevel === 'owner' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ink-muted)]">
              Viewing your own profile ({profile.visibility === 'public' ? 'Public' : profile.visibility === 'edc_members' ? 'EDC Members' : 'Private'})
            </span>
            <StudioButton variant="secondary" size="sm" onClick={() => navigate('/portal/profile')}>
              Edit in Identity Studio
            </StudioButton>
          </div>
        )}

        {projection.accessLevel === 'admin_preview' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
            <Lock className="h-3.5 w-3.5" />
            <span>Administrative Governance View (Profile is Private)</span>
          </span>
        )}
      </div>

      {/* Editorial Member Header */}
      <header className="studio-card p-7 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <MemberAvatar
              name={profile.displayName}
              avatarUrl={profile.avatarUrl}
              avatarPosition={profile.avatarPosition}
              size="xl"
              tone="obsidian"
            />
            <div className="min-w-0 space-y-2">
              <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#F87171]">
                EDC AITR · {profile.roleLabel}
                {profile.operationalTeam ? ` · ${profile.operationalTeam} Unit` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-[var(--color-2-mood)]">
                  {profile.displayName}
                </h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-secondary)]">
                    <ShieldCheck className="h-4 w-4 text-[#C01E30] dark:text-[#F87171]" />
                    <span>Verified Member</span>
                  </span>
                )}
              </div>
              {profile.designation && (
                <p className="text-base text-[var(--ink-secondary)] leading-snug">
                  {profile.designation}
                  {profile.company && profile.role === 'alumni' ? ` · ${profile.company}` : ''}
                </p>
              )}
              <p className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
                {profile.department && <span>{profile.department}</span>}
                {profile.batch && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.batch === 'Faculty' ? 'Faculty Leadership' : `Batch ${profile.batch}`}</span>
                  </>
                )}
                {profile.city && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.city}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {currentUser && rawTarget && currentUser.id !== rawTarget.id && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={() => startOrOpenConversationWithUser(rawTarget)}
              className="shrink-0 self-start"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Message Member</span>
            </StudioButton>
          )}
        </div>

        {profile.bio && (
          <div className="pt-6 border-t border-[var(--border-hairline)]">
            <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed max-w-prose">
              {profile.bio}
            </p>
          </div>
        )}
      </header>

      {/* Two-Column Editorial Portfolio Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Role-Specific Highlights */}
          <section className="studio-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-hairline)]">
              <Briefcase className="h-4 w-4 text-[#C01E30]" />
              <h2 className="text-base font-display font-semibold text-[var(--color-2-mood)]">
                {profile.role === 'director'
                  ? 'Institutional Leadership & Mandate'
                  : profile.role === 'core_team'
                    ? 'Operational Mandate'
                    : profile.role === 'advisor'
                      ? 'Advisory & Mentorship Focus'
                      : profile.role === 'alumni'
                        ? 'Venture & Career Profile'
                        : 'Academic & Builder Profile'}
              </h2>
            </div>

            {profile.leadershipIntro && (
              <p className="text-sm text-[var(--color-2-mood)] leading-relaxed">
                {profile.leadershipIntro}
              </p>
            )}

            <dl className="divide-y divide-[var(--border-hairline)] text-sm">
              {profile.company && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Organization</dt>
                  <dd className="text-[var(--color-2-mood)] font-medium">{profile.company}</dd>
                </div>
              )}
              {profile.industry && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Industry Sector</dt>
                  <dd className="text-[var(--color-2-mood)]">{profile.industry}</dd>
                </div>
              )}
              {profile.startupName && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Startup / Venture</dt>
                  <dd className="text-[var(--color-2-mood)] font-medium">
                    {profile.startupName}
                    {profile.startupStage && profile.startupStage !== 'None' ? ` · ${profile.startupStage}` : ''}
                  </dd>
                </div>
              )}
              {profile.teamPosition && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Operational Position</dt>
                  <dd className="text-[var(--color-2-mood)]">{profile.teamPosition}</dd>
                </div>
              )}
              {profile.pastEdcRole && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">EDC History</dt>
                  <dd className="text-[var(--color-2-mood)]">{profile.pastEdcRole}</dd>
                </div>
              )}
              {profile.college && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Institution</dt>
                  <dd className="text-[var(--color-2-mood)]">{profile.college}</dd>
                </div>
              )}
              {profile.course && (
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Academic Program</dt>
                  <dd className="text-[var(--color-2-mood)]">
                    {profile.course}
                    {profile.academicYear ? ` · ${profile.academicYear}` : ''}
                  </dd>
                </div>
              )}
              {profile.professionalBackground && (
                <div className="py-3 space-y-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Background</dt>
                  <dd className="text-[var(--ink-secondary)] leading-relaxed">{profile.professionalBackground}</dd>
                </div>
              )}
              {profile.experienceSummary && (
                <div className="py-3 space-y-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Experience Summary</dt>
                  <dd className="text-[var(--ink-secondary)] leading-relaxed">{profile.experienceSummary}</dd>
                </div>
              )}
              {profile.personalProjects && (
                <div className="py-3 space-y-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Projects</dt>
                  <dd className="text-[var(--ink-secondary)] leading-relaxed">{profile.personalProjects}</dd>
                </div>
              )}
              {profile.startupInterests && (
                <div className="py-3 space-y-1">
                  <dt className="text-xs font-medium text-[var(--ink-muted)]">Startup Interests</dt>
                  <dd className="text-[var(--ink-secondary)] leading-relaxed">{profile.startupInterests}</dd>
                </div>
              )}
            </dl>

            {profile.institutionalResponsibilities && profile.institutionalResponsibilities.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                  Institutional Responsibilities
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                  {profile.institutionalResponsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.areasOfResponsibility && profile.areasOfResponsibility.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                  Areas of Responsibility
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                  {profile.areasOfResponsibility.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.publicAchievements && profile.publicAchievements.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                  Notable Institutional Milestones
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                  {profile.publicAchievements.map((ach) => (
                    <li key={ach}>{ach}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.openToMentorship && (
              <div className="p-4 rounded-[9px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C01E30] dark:text-[#F87171]">
                  Open to Student Founder Mentorship
                </p>
                {profile.mentorshipDomains && profile.mentorshipDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.mentorshipDomains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2.5 py-1 rounded-[6px] text-xs bg-[var(--surface)] border border-[var(--border-hairline)] text-[var(--color-2-mood)]"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profile.expertiseDomains && profile.expertiseDomains.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                  Expertise Domains
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.expertiseDomains.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-[6px] text-xs bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--color-2-mood)]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Editorial Rail: Skills, Interests, Approved Links */}
        <aside className="lg:col-span-4 space-y-5">
          {(profile.skills.length > 0 || profile.interests.length > 0) && (
            <section className="studio-card p-6 space-y-5">
              {profile.skills.length > 0 && (
                <div className="space-y-2.5">
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Skills &amp; Capabilities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-[6px] text-xs bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--color-2-mood)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-[var(--border-hairline)]">
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Areas of Interest
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2.5 py-1 rounded-[6px] text-xs bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--ink-secondary)]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {(externalLinks.length > 0 || profile.email || profile.phone) && (
            <section className="studio-card p-6 space-y-3">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Approved Links &amp; Contact
              </p>
              <div className="divide-y divide-[var(--border-hairline)]">
                {externalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 flex items-center justify-between gap-2 text-xs font-medium text-[var(--color-2-mood)] hover:text-[#C01E30] dark:hover:text-[#F87171] transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                      <span>{link.label}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs text-[var(--ink-secondary)] hover:text-[#C01E30]"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)]" />
                      <span className="truncate">{profile.email}</span>
                    </span>
                  </a>
                )}

                {profile.phone && (
                  <div className="py-2.5 flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)]" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="studio-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-2-mood)]">
              <GraduationCap className="h-4 w-4 text-[#C01E30]" />
              <span>Entrepreneurship Development Cell</span>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              Acropolis Institute of Technology &amp; Research, Indore · Verified Institutional
              Member Profile.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};
