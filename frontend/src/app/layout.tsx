import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './style.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
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
        <header className="site-header">
          <Link href="/" className="brand-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/edc-logo-light.png"
              alt="EDC AITR — Entrepreneurship Development Cell"
              style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <Link href="/team">Team</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/account" className="nav-cta">
              Account
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/edc-logo-light.png"
              alt="EDC AITR"
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
