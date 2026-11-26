import React from 'react';
import type { Metadata } from 'next';
import { PublicMemberProfileClient } from './PublicMemberProfileClient';
import { SEED_USERS } from '../../../data/seedData';
import { getBaseUrl, SITE_CONFIG } from '../../../lib/seo';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const user = SEED_USERS.find((u) => u.id === decoded || u.email.toLowerCase() === decoded.toLowerCase());

  const baseUrl = getBaseUrl();
  const title = user
    ? `${user.name} (${user.designation}) | EDC AITR Member`
    : `Member Profile | EDC AITR`;
  const description = user?.bio
    ? user.bio
    : `Verified member profile of the Entrepreneurship Development Cell at Acropolis Institute of Technology and Research, Indore.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/members/${encodeURIComponent(decoded)}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/members/${encodeURIComponent(decoded)}`,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'profile',
    },
  };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  return <PublicMemberProfileClient memberId={id} />;
}
