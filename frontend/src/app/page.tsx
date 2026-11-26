import type { Metadata } from 'next';
import { getPublicEvents } from '../lib/events/events';
import { createPageMetadata, SITE_CONFIG } from '../lib/seo';
import ReferenceHome from '../components/home/ReferenceHome';

export const dynamic = 'force-dynamic';

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

export default async function HomePage() {
  const events = await getPublicEvents(false);
  const activeEvents = events.filter(
    (event) => event.status === 'published' || event.status === 'ongoing'
  );

  return <ReferenceHome events={activeEvents} />;
}
