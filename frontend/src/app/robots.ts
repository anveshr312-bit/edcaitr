import type { MetadataRoute } from 'next';
import { getBaseUrl, isProductionDeployment } from '../lib/seo';

/**
 * Dynamic robots.txt configuration for Next.js App Router.
 * - Allows full crawling of public routes on production.
 * - Disallows administrative, auth, participant, and internal operations.
 * - Completely disallows non-production / preview deployments.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const isProd = isProductionDeployment();

  if (!isProd) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/events',
          '/events/*',
          '/team',
          '/contact',
          '/summit-assets/*',
          '/*.png',
          '/*.webp',
          '/*.svg',
          '/*.ico',
        ],
        disallow: [
          '/account',
          '/account/*',
          '/workspace',
          '/workspace/*',
          '/portal',
          '/portal/*',
          '/alumni',
          '/alumni/*',
          '/api',
          '/api/*',
          '/auth',
          '/auth/*',
          '/*?*preview*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/events',
          '/events/*',
          '/team',
          '/contact',
        ],
        disallow: [
          '/account/*',
          '/workspace/*',
          '/portal/*',
          '/alumni/*',
          '/api/*',
          '/auth/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
