import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import WebVitals from '../components/WebVitals';
import LogoParticleLoader from '../components/LogoParticleLoader';
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
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

        <footer className="site-footer" style={{ background: 'var(--surface-subtle)', color: 'var(--text-primary)', padding: '56px clamp(16px, 4vw, 48px) 36px', marginTop: 80, borderTop: '1px solid var(--border-hairline)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 48, marginBottom: 48 }}>
            {/* Col 1: Brand & Institution */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/edc-logo-light.webp"
                alt="EDC AITR"
                width={140}
                height={48}
                style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 16 }}
              />
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Entrepreneurship Development Cell &amp; AIIH Foundation at Acropolis Institute of Technology and Research (AITR), Indore.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Bypass Road, Manglia Square, Indore, Madhya Pradesh 453771
              </p>
            </div>

            {/* Col 2: Navigation Directory */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>
                Navigation
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10, fontSize: 13 }}>
                <li><Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Home</Link></li>
                <li><Link href="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Events &amp; Summits</Link></li>
                <li><Link href="/team" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Leadership &amp; Teams</Link></li>
                <li><Link href="/about" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>About EDC &amp; AIIH</Link></li>
                <li><Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Contact &amp; Partnerships</Link></li>
                <li><Link href="/account" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Participant Portal</Link></li>
              </ul>
            </div>

            {/* Col 3: Community & Campus Connect */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>
                Community &amp; Connect
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Central India&apos;s student innovation hub with 2 Lakh+ audience reach. Transit networks connect students across Indore, Dewas, Ujjain, and Maksi.
              </p>
              <a
                href="https://www.instagram.com/edc_acropolis"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-control)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              &copy; {new Date().getFullYear()} Entrepreneurship Development Cell, AITR
            </div>
            <div>
              AIIH Foundation · Acropolis Group of Institutions
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
