import type { ReactNode } from 'react';
import Link from 'next/link';
import './style.css';

export const metadata = {
  title: 'E-Cell AITR',
  description: 'Entrepreneurship Development Cell, Acropolis Institute of Technology and Research',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            E-Cell AITR
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <Link href="/team">Team</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/account" className="btn">
              Account
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <span>E-Cell AITR · Acropolis Institute of Technology &amp; Research</span>
          <span>
            <Link href="/about">About</Link> · <Link href="/contact">Contact</Link> ·{' '}
            <Link href="/account">Participant Portal</Link>
          </span>
        </footer>
      </body>
    </html>
  );
}
