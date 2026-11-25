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
          <Link href="/" className="brand-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ecell-logo.svg" alt="EDC AITR logo" width={32} height={32} />
            <span>EDC AITR</span>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ecell-logo.svg" alt="" width={20} height={20} />
            <span>Entrepreneurship Development Cell (EDC), Acropolis Institute of Technology &amp; Research (AITR)</span>
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
