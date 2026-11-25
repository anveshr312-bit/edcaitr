import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createPageMetadata } from '../../lib/seo';
import { BreadcrumbStructuredData } from '../../components/StructuredData';

export const metadata: Metadata = createPageMetadata({
  title: 'Contact & Partnerships — Connect With EDC AITR',
  description: 'Get in touch with the Entrepreneurship Development Cell at Acropolis Institute, Indore for startup incubation, event sponsorships, or campus partnerships.',
  path: '/contact',
  keywords: [
    'Contact EDC AITR',
    'EDC Acropolis office',
    'Sponsor E-Summit Indore',
    'Startup incubation inquiry Indore',
    'Acropolis Institute Manglia Square contact',
  ],
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'Contact Us', path: '/contact' },
        ]}
      />
      {children}
    </>
  );
}
