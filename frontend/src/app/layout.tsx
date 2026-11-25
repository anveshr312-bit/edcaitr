import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import WebVitals from '../components/WebVitals';
import './style.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  preload: true,
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});

export const metadata = {
  title: 'EDC AITR — Entrepreneurship Development Cell | Acropolis Institute',
  description: 'Official portal of Entrepreneurship Development Cell (EDC) & AIIH Foundation at Acropolis Institute of Technology and Research (AITR), Indore.',
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
              style={{ height: 44, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </Link>
          <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <Link href="/team">Team</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <a
              href="https://www.instagram.com/edc_acropolis"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="EDC AITR on Instagram"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <span>@edc_acropolis</span>
            </a>
            <Link href="/account/dashboard" className="nav-cta">
              Account
            </Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer style={{ background: 'var(--surface-subtle)', color: 'var(--text-primary)', padding: '56px clamp(16px, 4vw, 48px) 36px', marginTop: 80, borderTop: '1px solid var(--border-hairline)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>
            {/* Col 1: Brand & College */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/edc-logo-light.webp"
                alt="EDC AITR"
                width={140}
                height={48}
                style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 16 }}
              />
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Entrepreneurship Development Cell &amp; AIIH Foundation at Acropolis Institute of Technology and Research (AITR), Indore.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Bypass Road, Manglia Square, Indore, Madhya Pradesh 453771
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                Explore
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10, fontSize: 14 }}>
                <li><Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Home</Link></li>
                <li><Link href="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Events &amp; E-Summit</Link></li>
                <li><Link href="/team" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Leadership &amp; Coordinators</Link></li>
                <li><Link href="/about" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>About EDC &amp; 12 Teams</Link></li>
                <li><Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Contact &amp; Partnerships</Link></li>
              </ul>
            </div>

            {/* Col 3: Student Leads */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                Coordinators
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <li><strong>Kavyansh Singh Rajput</strong> · +91 8839988997</li>
                <li><strong>Pradhyumn Mehta</strong> · +91 8770527096</li>
                <li><strong>Ishaan Dadoo</strong> · +91 6232400399</li>
                <li><strong>Prince Joshi</strong> · +91 8209657305</li>
              </ul>
            </div>

            {/* Col 4: Community & Reach */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                Community &amp; Reach
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Central India&apos;s leading student innovation hub with <strong>2 Lakh+ audience reach</strong> and bus networks across Indore, Dewas, Ujjain, and Maksi.
              </p>
              <a
                href="https://www.instagram.com/edc_acropolis"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--color-3-accent-personality)', color: '#fff', borderRadius: 'var(--radius-control)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                Follow @edc_acropolis
              </a>
            </div>
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 24, borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <div>
              &copy; {new Date().getFullYear()} Entrepreneurship Development Cell (EDC), AITR. All rights reserved.
            </div>
            <div>
              Acropolis Institute of Technology &amp; Research · AIIH Foundation
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
