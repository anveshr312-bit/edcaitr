import type { Metadata } from 'next';

/**
 * EDC AITR — Centralized SEO Configuration
 * Handles environment-aware canonical URLs, metadata generation, and robots directives.
 */

export const SITE_CONFIG = {
  name: 'EDC AITR',
  legalName: 'Entrepreneurship Development Cell, Acropolis Institute of Technology and Research, Indore',
  shortDescription: 'Discover entrepreneurship, startup opportunities, innovation, mentorship and upcoming events at the Entrepreneurship Development Cell of Acropolis Institute of Technology and Research, Indore.',
  defaultTitle: 'EDC AITR | Entrepreneurship Development Cell, Indore',
  titleTemplate: '%s | EDC AITR',
  productionUrl: 'https://edcaitr.vercel.app',
  social: {
    instagram: 'https://www.instagram.com/edc_acropolis',
    instagramHandle: '@edc_acropolis',
  },
  institution: {
    name: 'Acropolis Institute of Technology and Research (AITR)',
    incubationPartner: 'AIIH Foundation (Acropolis Institutional Incubation Hub)',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    postalCode: '453771',
    address: 'Bypass Road, Manglia Square, Indore, Madhya Pradesh 453771',
  },
  keywords: [
    'EDC AITR',
    'E-Cell AITR',
    'Acropolis E-Cell',
    'EDC Acropolis Indore',
    'Entrepreneurship Development Cell AITR',
    'Acropolis entrepreneurship cell',
    'Student entrepreneurship in Indore',
    'Startup events in Indore',
    'Entrepreneurship workshops in Indore',
    'AIIH Foundation',
    'E-Summit Indore',
    'PitchBiz',
    'Kriyeta Hackathon',
    'Campus Startup Initiative',
  ],
};

/**
 * Returns the sanitized base URL of the deployment.
 * Supports custom production domain, Vercel system environment variables, and fallback.
 */
export function getBaseUrl(): string {
  // 1. Explicit public site URL (custom domain or set in env)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const raw = process.env.NEXT_PUBLIC_SITE_URL.trim();
    return raw.startsWith('http') ? raw.replace(/\/$/, '') : `https://${raw}`.replace(/\/$/, '');
  }

  // 2. Vercel production deployment URL (provided by Vercel system)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }

  // 3. Vercel preview deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // 4. Fallback to documented production URL
  return SITE_CONFIG.productionUrl;
}

/**
 * Determines whether the current deployment is production and eligible for search engine indexing.
 * Vercel preview deployments are blocked from indexing to avoid duplicate content penalties.
 */
export function isProductionDeployment(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production';
  }
  return process.env.NODE_ENV === 'production';
}

interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generates route-level Metadata with complete Open Graph, Twitter, and canonical specifications.
 */
export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  ogImage = '/og-image.png',
  ogType = 'website',
  publishedTime,
  modifiedTime,
}: PageSeoOptions): Metadata {
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;
  const isProd = isProductionDeployment();

  return {
    title,
    description,
    keywords: keywords ? [...keywords, ...SITE_CONFIG.keywords] : SITE_CONFIG.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isProd
      ? {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        }
      : {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: `${title} — ${SITE_CONFIG.name}`,
        },
      ],
      locale: 'en_IN',
      type: ogType,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImage],
      creator: SITE_CONFIG.social.instagramHandle,
    },
  };
}

/**
 * Generates strict noindex metadata for authenticated, admin, and private views.
 */
export function createPrivateMetadata(title: string): Metadata {
  return {
    title: `${title} | EDC AITR`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
      nosnippet: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
