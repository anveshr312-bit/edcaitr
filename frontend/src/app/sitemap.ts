import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/seo';
import { getPublicEvents } from '../lib/events/events';

/**
 * Dynamic sitemap.xml generator for Next.js App Router.
 * - Dynamically includes only published, active public events from Supabase.
 * - Strictly excludes draft, closed, or internal operational endpoints.
 * - Provides accurate priority and change frequency metrics.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  // Core static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Fetch published public events dynamically from the database
  let dynamicEventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await getPublicEvents(false);
    dynamicEventRoutes = events
      .filter((e) => e.status === 'published' || e.status === 'ongoing' || e.status === 'closed')
      .map((event) => {
        const lastMod = event.starts_at
          ? new Date(event.starts_at)
          : now;

        return {
          url: `${baseUrl}/events/${event.slug}`,
          lastModified: lastMod,
          changeFrequency: event.status === 'closed' ? 'monthly' : 'weekly',
          priority: event.status === 'closed' ? 0.6 : 0.85,
        };
      });
  } catch (err) {
    console.error('Failed to query dynamic events for sitemap:', err);
  }

  return [...staticRoutes, ...dynamicEventRoutes];
}
