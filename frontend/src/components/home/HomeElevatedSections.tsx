'use client';

import React, { useMemo, useState } from 'react';
import { MARQUEE_GUESTS, EDITORIAL_IMAGES, PARTNER_ORGANIZATIONS } from '../../data/seedData';
import { GuestCoverflow } from '../ui/GuestCoverflow';
import { AccordionGallery, type AccordionGalleryItem } from '../ui/AccordionGallery';
import { LogoLoop } from '../ui/LogoLoop';

export function HomeSpeakersSection() {
  return (
    <section style={{ margin: '64px 0 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C01E30', marginBottom: 6 }}>
            Speaker Archive
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Guests We Hosted
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Swipe, drag, or use arrow keys to browse keynote guests
        </p>
      </div>

      <div style={{ padding: '12px 0' }}>
        <GuestCoverflow guests={MARQUEE_GUESTS} />
      </div>
    </section>
  );
}

export function HomeAccordionSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const items: AccordionGalleryItem[] = useMemo(
    () => [
      {
        image: EDITORIAL_IMAGES.summitStage,
        label: 'FOKUS X E-Summit',
        subtitle: 'Auditorium Main Stage · 2 Lakh+ Outreach',
        code: 'SUMMIT',
      },
      {
        image: EDITORIAL_IMAGES.heroFounders,
        label: 'Campus Founders Studio',
        subtitle: 'AIIH Co-working Incubator',
        code: 'CAMPUS',
      },
      {
        image: EDITORIAL_IMAGES.pitchbizArena,
        label: 'PitchBiz Investment Arena',
        subtitle: 'Angel Syndicates & VC Roundtables',
        code: 'PITCH',
      },
      {
        image: EDITORIAL_IMAGES.csiFablab,
        label: 'Hardware FabLab',
        subtitle: 'Prototyping & CNC Testing Bays',
        code: 'FABLAB',
      },
      {
        image: EDITORIAL_IMAGES.kriyetaSprint,
        label: 'Kriyeta Hackathon Sprint',
        subtitle: '48-Hour National Build Marathon',
        code: 'HACK',
      },
      {
        image: EDITORIAL_IMAGES.masterclassWorkshop,
        label: 'Founder Masterclasses',
        subtitle: 'Unit Economics & Term Sheet Bootcamps',
        code: 'MASTERS',
      },
      {
        image: EDITORIAL_IMAGES.tedxFireside,
        label: 'Disruptive Dialogues',
        subtitle: 'TEDx Acropolis Fireside Panels',
        code: 'TEDX',
      },
    ],
    []
  );

  return (
    <section style={{ margin: '56px 0 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C01E30', marginBottom: 6 }}>
            Campus &amp; Summit Architecture
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ecosystem in Motion
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Hover or tap panels to expand campus facilities &amp; event venues
        </p>
      </div>

      <AccordionGallery
        items={items}
        defaultIndex={0}
        accentColor="#C01E30"
        height={420}
        radius={9}
        onActiveChange={(idx) => setActiveIdx(idx)}
      />
    </section>
  );
}

export function HomePartnersSection() {
  const partnerNodes = useMemo(
    () =>
      PARTNER_ORGANIZATIONS.map((p) => ({
        node: (
          <div
            key={p.name}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--border-hairline)',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {p.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {p.role}
            </span>
          </div>
        ),
      })),
    []
  );

  return (
    <section style={{ margin: '56px 0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C01E30', marginBottom: 6 }}>
            Ecosystem Network
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Organisations That Back Us
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Incubators, venture syndicates, and national industry bodies
        </p>
      </div>

      <div style={{ padding: '8px 0' }}>
        <LogoLoop logos={partnerNodes} speed={40} gap={16} />
      </div>
    </section>
  );
}
