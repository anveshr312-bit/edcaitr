import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import WebVitals from '../components/WebVitals';
import './style.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});

export const metadata = {
  title: 'EDC AITR — Entrepreneurship Development Cell',
  description: 'Entrepreneurship Development Cell (EDC) at Acropolis Institute of Technology and Research (AITR)',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <WebVitals />
        <header className="site-header">
          <Link href="/" className="brand-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/edc-logo-light.webp"
              alt="EDC AITR — Entrepreneurship Development Cell"
              width={143}
              height={48}
              decoding="async"
              style={{ height: 48, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <Link href="/team">Team</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/account/dashboard" className="nav-cta">
              Account
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/edc-logo-light.webp"
              alt="EDC AITR"
              width={90}
              height={30}
              loading="lazy"
              decoding="async"
              style={{ height: 30, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#686D7A' }}>
              Entrepreneurship Development Cell (EDC), Acropolis Institute of Technology &amp; Research (AITR)
            </span>
          </div>
          <div>
            <Link href="/events">Events</Link> · <Link href="/team">Team</Link> ·{' '}
            <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
