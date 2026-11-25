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
    setTimeout(() => setStage('printing'), 450);
    setTimeout(() => setStage('complete'), 2300);
  }

  useEffect(() => {
    runPrintAnimation();
  }, []);

  const dateText = eventStartsAt
    ? new Date(eventStartsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Schedule TBA';

  return (
    <div style={{ display: 'grid', gap: 20, justifyItems: 'center' }}>
      <ReceiptPrinter.Root stage={stage} feedMotion="stepped">
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              EDC AITR · ENTRY PASS
            </span>
            <span className="mono-meta" style={{ color: 'rgba(251,249,245,0.65)' }}>
              {ticketCode}
            </span>
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(17,19,24,0.2)', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: '#e04826', fontWeight: 700, letterSpacing: '0.08em' }}>
                OFFICIAL EVENT TICKET
              </div>
              <h2 style={{ margin: '6px 0 4px', fontSize: '1.1rem', fontFamily: 'var(--font-sans)' }}>
                {eventTitle}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                {dateText} {eventVenue ? `· ${eventVenue}` : ''}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#686d7a' }}>Attendee</span>
                <strong>{attendeeName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#686d7a' }}>Category</span>
                <span>{category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#686d7a' }}>Ticket ID</span>
                <strong>{ticketCode}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', placeItems: 'center', padding: '12px 0', borderTop: '1px dashed rgba(17,19,24,0.2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Ticket ${ticketCode}`}
                width={180}
                height={180}
                style={{ display: 'block', borderRadius: 6 }}
              />
              <span style={{ fontSize: '0.72rem', color: '#686d7a', marginTop: 8 }}>
                Scan at Registration &amp; Check-in (RD) Desk
              </span>
            </div>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" onClick={runPrintAnimation}>
          Reprint ticket
        </button>
        <a href={qrDataUrl} download={`${ticketCode}.png`} className="btn btn-primary">
          Download QR Pass
        </a>
      </div>

      <p className="mono-meta" style={{ textAlign: 'center', margin: 0 }}>
        {emailSentAt
          ? `Ticket copy sent to your email on ${new Date(emailSentAt).toLocaleString('en-IN')}`
          : 'Email copy is sent automatically when Brevo transactional mail is configured.'}
      </p>
    </div>
  );
}
