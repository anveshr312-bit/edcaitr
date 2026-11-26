import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicTeamProfiles } from '../../../lib/events/events';
import { getImageKitUrl } from '../../../lib/media/imagekit';
import { getBaseUrl, SITE_CONFIG } from '../../../lib/seo';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const memberId = decodeURIComponent(id);
  const user = (await getPublicTeamProfiles()).find((member) => member.id === memberId);

  const baseUrl = getBaseUrl();
  const title = user
    ? `${user.full_name} (${user.designation ?? user.role}) | EDC AITR Member`
    : `Member Profile | EDC AITR`;
  const description = user?.bio
    ? user.bio
    : `Verified member profile of the Entrepreneurship Development Cell at Acropolis Institute of Technology and Research, Indore.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/members/${encodeURIComponent(memberId)}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/members/${encodeURIComponent(memberId)}`,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'profile',
    },
  };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  const memberId = decodeURIComponent(id);
  const member = (await getPublicTeamProfiles()).find((profile) => profile.id === memberId);
  if (!member) notFound();

  const avatarUrl = getImageKitUrl(member.avatar_ref);
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Link href="/team" className="text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:text-[#C01E30]">
        ← Back to EDC AITR team
      </Link>
      <div className="mt-8 rounded-3xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 shadow-sm sm:p-10">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#C01E30] font-display text-3xl font-semibold text-white">
            {member.full_name.charAt(0)}
          </div>
        )}
        <p className="mt-8 font-mono-data text-xs uppercase tracking-[0.16em] text-[#C01E30]">EDC AITR · {member.role.replace('_', ' ')}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--color-2-mood)] sm:text-5xl">
          {member.full_name}
        </h1>
        {member.designation && <p className="mt-3 text-lg text-[var(--ink-secondary)]">{member.designation}</p>}
        {member.bio && <p className="mt-8 max-w-2xl whitespace-pre-line text-base leading-7 text-[var(--ink-secondary)]">{member.bio}</p>}
        {member.linkedin_url && (
          <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-2-mood)] transition-colors hover:border-[#C01E30] hover:text-[#C01E30]">
            LinkedIn profile
          </a>
        )}
      </div>
    </article>
  );
}
