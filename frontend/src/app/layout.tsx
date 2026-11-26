import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import WebVitals from '../components/WebVitals';
import LogoParticleLoader from '../components/LogoParticleLoader';
import { GlobalStructuredData } from '../components/StructuredData';
import { GlobalMotionShell } from '../components/layout/GlobalMotionShell';
import { SiteChrome } from '../components/layout/SiteChrome';
import { getBaseUrl, SITE_CONFIG, isProductionDeployment } from '../lib/seo';
import './style.css';

const display = localFont({
  src: '../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  display: 'swap',
  weight: '200 800',
  variable: '--font-bricolage',
});

const sans = localFont({
  src: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
  display: 'swap',
  weight: '100 1000',
  variable: '--font-dm-sans',
});

const mono = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
      weight: '400',
    },
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
      weight: '500',
    },
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2',
      weight: '600',
    },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-ibm-plex-mono',
});

const baseUrl = getBaseUrl();
const isProd = isProductionDeployment();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.shortDescription,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.name, url: baseUrl }],
  generator: 'Next.js',
  keywords: SITE_CONFIG.keywords,
  referrer: 'origin-when-cross-origin',
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.legalName,
  formatDetection: {
    email: false,
    address: true,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.shortDescription,
    url: baseUrl,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} — ${SITE_CONFIG.legalName}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.shortDescription,
    images: [`${baseUrl}/og-image.png`],
    creator: SITE_CONFIG.social.instagramHandle,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'googlea45780b984ee2d34',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <GlobalStructuredData />
        {/* Critical synchronous preloader initialization to eliminate initial homepage flash (P0) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var seen = sessionStorage.getItem('edc_cinematic_intro_seen');
                  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  if (!seen && !rm) {
                    document.documentElement.classList.add('edc-preloader-active');
                    // Safety fail-safe in case of any runtime stalling
                    setTimeout(function() {
                      document.documentElement.classList.remove('edc-preloader-active');
                    }, 4200);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <LogoParticleLoader />
        <WebVitals />
        <GlobalMotionShell>
          <SiteChrome>{children}</SiteChrome>
        </GlobalMotionShell>
      </body>
    </html>
  );
}
