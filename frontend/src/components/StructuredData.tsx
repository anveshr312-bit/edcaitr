import { getBaseUrl, SITE_CONFIG } from '../lib/seo';

/**
 * Global Organization and WebSite JSON-LD Schema
 */
export function GlobalStructuredData() {
  const baseUrl = getBaseUrl();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_CONFIG.legalName,
    alternateName: ['EDC AITR', 'E-Cell AITR', 'Acropolis E-Cell', 'EDC Acropolis'],
    url: baseUrl,
    logo: `${baseUrl}/edc-emblem-clean.png`,
    image: `${baseUrl}/og-image.png`,
    description: SITE_CONFIG.shortDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Bypass Road, Manglia Square',
      addressLocality: SITE_CONFIG.institution.city,
      addressRegion: SITE_CONFIG.institution.state,
      postalCode: SITE_CONFIG.institution.postalCode,
      addressCountry: 'IN',
    },
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: SITE_CONFIG.institution.name,
      url: 'https://aitr.ac.in',
    },
    memberOf: {
      '@type': 'Organization',
      name: SITE_CONFIG.institution.incubationPartner,
    },
    sameAs: [
      SITE_CONFIG.social.instagram,
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    alternateName: 'Entrepreneurship Development Cell AITR',
    url: baseUrl,
    description: SITE_CONFIG.shortDescription,
    publisher: {
      '@type': 'EducationalOrganization',
      name: SITE_CONFIG.legalName,
    },
    inLanguage: 'en-IN',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

/**
 * BreadcrumbList Schema Component
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const baseUrl = getBaseUrl();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface EventSchemaProps {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  venue?: string | null;
  isPaid?: boolean | null;
  feeAmount?: number | null;
  bannerUrl?: string | null;
  status?: string | null;
}

/**
 * Event JSON-LD Schema for Published Events
 */
export function EventStructuredData({ event }: { event: EventSchemaProps }) {
  const baseUrl = getBaseUrl();
  const eventUrl = `${baseUrl}/events/${event.slug}`;
  const banner = event.bannerUrl || `${baseUrl}/og-image.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.summary || event.title,
    url: eventUrl,
    image: [banner],
    startDate: event.startsAt || new Date().toISOString(),
    ...(event.endsAt && { endDate: event.endsAt }),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus:
      event.status === 'closed'
        ? 'https://schema.org/EventMovedOnline'
        : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.venue || `${SITE_CONFIG.institution.name}, Indore`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bypass Road, Manglia Square',
        addressLocality: SITE_CONFIG.institution.city,
        addressRegion: SITE_CONFIG.institution.state,
        postalCode: SITE_CONFIG.institution.postalCode,
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'EducationalOrganization',
      name: SITE_CONFIG.name,
      url: baseUrl,
    },
    offers: {
      '@type': 'Offer',
      price: event.isPaid && event.feeAmount ? event.feeAmount : '0',
      priceCurrency: 'INR',
      availability:
        event.status === 'closed'
          ? 'https://schema.org/Discontinued'
          : 'https://schema.org/InStock',
      url: eventUrl,
      validFrom: event.startsAt || new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
