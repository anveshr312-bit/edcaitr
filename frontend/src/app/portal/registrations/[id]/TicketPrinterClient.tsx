'use client';

import { useEffect, useState } from 'react';
import { ReceiptPrinter, type ReceiptPrinterStage } from '../../../../components/ReceiptPrinter';

interface Props {
  eventTitle: string;
  eventVenue: string | null;
  eventStartsAt: string | null;
  attendeeName: string;
  category: string;
  ticketCode: string;
  qrDataUrl: string;
  emailSentAt: string | null;
}

// Deterministic barcode line widths for PVR-style barcode rendering
const barcodePattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 1, 2];

export default function TicketPrinterClient({
  eventTitle,
  eventVenue,
  eventStartsAt,
  attendeeName,
  category,
  ticketCode,
  qrDataUrl,
  emailSentAt,
}: Props) {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');

  function runPrintAnimation() {
    setStage('processing');
    setTimeout(() => setStage('printing'), 400);
    setTimeout(() => setStage('complete'), 2200);
  }

  useEffect(() => {
    runPrintAnimation();
  }, []);

  const eventDate = eventStartsAt ? new Date(eventStartsAt) : null;
  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date TBA';

  const timeFormatted = eventDate
    ? eventDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Time TBA';

  return (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'center', width: '100%', maxWidth: 440, margin: '0 auto' }}>
      <ReceiptPrinter.Root stage={stage} feedMotion="stepped">
        {/* Kiosk / Machine Head with dark EDC logo */}
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/edc-logo-dark.png"
                alt="EDC Logo"
                style={{ height: 20, width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fbf9f5' }}>
                PASS DISPENSER
              </span>
            </div>
            <span className="mono-meta" style={{ color: '#e04826', fontWeight: 700, fontSize: '0.72rem' }}>
              #EDC-TKT
            </span>
          </ReceiptPrinter.Header>

          <ReceiptPrinter.Screen>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {/* The Paper Ticket (PVR Cinema Pass) */}
        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            {/* Header: EDC Light Logo & PVR Badge */}
            <div className="pvr-ticket-header">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/edc-logo-light.png"
                  alt="Entrepreneurship Development Cell · Acropolis"
                  style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div className="pvr-admit-badge">
                ★ OFFICIAL ADMISSION PASS ★
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#686d7a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                REF: PVR-EDC-{ticketCode.slice(-8)}
              </div>
            </div>

            {/* Event Name & Screen / Venue */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e04826', fontWeight: 700 }}>
                {category.toUpperCase()} ACCESS
              </div>
              <h2 className="pvr-title">
                {eventTitle}
              </h2>
            </div>

            {/* PVR Cinema Meta Grid */}
            <div className="pvr-grid" style={{ borderTop: '1px solid rgba(17,19,24,0.08)', borderBottom: '1px solid rgba(17,19,24,0.08)' }}>
              <div>
                <div className="pvr-label">AUDI / VENUE</div>
                <div className="pvr-value" style={{ fontSize: '0.8125rem' }}>
                  {eventVenue || 'Campus Auditorium'}
                </div>
              </div>
              <div>
                <div className="pvr-label">SHOW DATE</div>
                <div className="pvr-value">{dateFormatted}</div>
              </div>
              <div>
                <div className="pvr-label">SHOW TIME</div>
                <div className="pvr-value">{timeFormatted}</div>
              </div>
              <div>
                <div className="pvr-label">ADMIT</div>
                <div className="pvr-value" style={{ color: '#e04826' }}>01 PERSON</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div className="pvr-label">TICKET HOLDER</div>
                <div className="pvr-value" style={{ fontSize: '0.875rem' }}>{attendeeName}</div>
              </div>
            </div>

            {/* Perforated Stub Tear Line (PVR Cinema Notches) */}
            <div className="pvr-perforation" aria-hidden="true">
              <div className="pvr-perforation-line" />
            </div>

            {/* Ticket Stub / QR Verification Section */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#111318', marginBottom: 8 }}>
                ENTRY VERIFICATION STUB
              </div>

              {/* QR Code with Cinema Target Brackets */}
              <div className="pvr-qr-box">
                <div style={{ position: 'relative', padding: 8, background: '#ffffff', borderRadius: 6, display: 'inline-block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`QR Ticket ${ticketCode}`}
                    width={176}
                    height={176}
                    style={{ display: 'block', margin: '0 auto' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#111318', marginTop: 8 }}>
                  {ticketCode}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#686d7a', marginTop: 2 }}>
                  Scan at Registration &amp; Check-in (RD) Desk
                </span>
              </div>

              {/* PVR Barcode */}
              <div className="pvr-barcode" aria-hidden="true">
                {barcodePattern.map((width, idx) => (
                  <span
                    key={idx}
                    className="pvr-barcode-bar"
                    style={{
                      width: `${width}px`,
                      marginRight: idx % 4 === 0 ? '2px' : '1px',
                    }}
                  />
                ))}
              </div>

              {/* Terms and Affiliation */}
              <p className="pvr-fineprint">
                Entrepreneurship Development Cell (EDC) · Acropolis Institute of Technology &amp; Research (AITR)
                <br />
                Non-transferable · Valid with college photo ID · Admission subject to venue rules
              </p>
            </div>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      {/* Interactive Controls (Hidden during print) */}
      <div className="print-hide" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Ticket
        </button>

        <a
          href={qrDataUrl}
          download={`ticket-${ticketCode}.png`}
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save QR Code
        </a>

        <button
          type="button"
          onClick={runPrintAnimation}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Re-feed Ticket
        </button>
      </div>

      <p className="mono-meta print-hide" style={{ textAlign: 'center', margin: 0, fontSize: '0.75rem', color: '#686d7a' }}>
        {emailSentAt
          ? `✓ Ticket pass was emailed to your inbox on ${new Date(emailSentAt).toLocaleString('en-IN')}`
          : '✓ Present this digital pass or printed copy at the gate on the event day.'}
      </p>
    </div>
  );
}
