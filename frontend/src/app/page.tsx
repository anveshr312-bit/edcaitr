import { Suspense } from 'react';
import { HomeHeroDrift } from '../components/home/HomeHeroDrift';
import type { Metadata } from 'next';
import { getPublicEvents } from '../lib/events/events';
import { createPageMetadata, SITE_CONFIG } from '../lib/seo';
import ReferenceHome from '../components/home/ReferenceHome';

export const revalidate = 60;

export const metadata: Metadata = createPageMetadata({
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.shortDescription,
  path: '/',
  keywords: [
    'EDC AITR Homepage',
    'Acropolis Entrepreneurship Development Cell',
    'Student startups Indore',
    'Central India E-Summit',
    'Venture incubation Acropolis',
  ],
});

async function HomeSections() {
  return <ReferenceHome events={await getPublicEvents(true)} />;
}

export default function HomePage() {
  return <><HomeHeroDrift /><Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh' }} />}><HomeSections /></Suspense></>;
}
