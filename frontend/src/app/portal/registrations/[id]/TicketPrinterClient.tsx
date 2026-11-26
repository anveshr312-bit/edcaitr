'use client';

import { useEffect, useState } from 'react';
import TearTicket from '../../../../components/ui/TearTicket';
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
  registrationId: string;
  initialCheckedIn: boolean;
  initialCheckedInTime: string | null;
}

// Deterministic barcode line widths for cinema barcode rendering
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
  registrationId,
  initialCheckedIn,
  initialCheckedInTime,
}: Props) {
  const [viewMode, setViewMode] = useState<'tear' | 'printer'>('tear');
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [checkedInTime, setCheckedInTime] = useState<string | null>(initialCheckedInTime);
  const [manuallyTorn, setManuallyTorn] = useState(false);

  // Poll for live gate scan check-in if not yet checked in
  useEffect(() => {
    if (checkedIn) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/registrations/${registrationId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.checked_in) {
            setCheckedIn(true);
            setCheckedInTime(data.checked_in_at);
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [checkedIn, registrationId]);

  function runPrintAnimation() {
    setStage('processing');
    setTimeout(() => setStage('printing'), 400);
    setTimeout(() => setStage('complete'), 2200);
  }

  useEffect(() => {
    if (viewMode === 'printer') {
      runPrintAnimation();
    }
  }, [viewMode]);

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

  const isTorn = checkedIn || manuallyTorn;

  return (
    <div className="w-full max-w-[560px] mx-auto space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-center p-1 rounded-xl bg-secondary/60 border border-border/40 w-fit mx-auto print-hide">
        <button
          type="button"
          onClick={() => setViewMode('tear')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'tear'
              ? 'bg-[#C01E30] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🎟 Interactive Admission Pass
        </button>
        <button
          type="button"
          onClick={() => setViewMode('printer')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'printer'
              ? 'bg-[#C01E30] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🖨 Kiosk Ticket Printer
        </button>
      </div>

      {/* Live Gate Status Banner */}
      <div
        className={`rounded-xl border p-3.5 text-center transition-all ${
          checkedIn
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wide">
          <span
            className={`w-2 h-2 rounded-full ${
              checkedIn ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
            }`}
          />
          {checkedIn
            ? `✓ ADMITTED & CHECKED IN AT GATE ${
                checkedInTime ? `(${new Date(checkedInTime).toLocaleTimeString('en-IN')})` : ''
              }`
            : 'GATE PASS ACTIVE • PRESENT QR CODE AT REGISTRATION DESK TO CHECK IN'}
        </div>
        {checkedIn && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Ticket stub has been torn and registered in the gate attendance log.
          </p>
        )}
      </div>

      {/* ── MODE 1: REACT BITS TEAR TICKET ── */}
      {viewMode === 'tear' && (
        <div className="flex flex-col items-center justify-center py-2">
          <TearTicket
            width={520}
            height={270}
            stubSize={175}
            radius={18}
            holes={14}
            holeSize={6}
            notch={4}
            torn={isTorn}
            defaultTorn={checkedIn}
            onTear={() => setManuallyTorn(true)}
            background="#121316"
            stubBackground="#17181c"
            color="#fdfdfd"
            borderColor="rgba(255, 255, 255, 0.12)"
            borderWidth={1}
            recenter
            tilt
            tiltMax={8}
            tiltReach={240}
            orientation="horizontal"
            stub={
              <div className="h-full flex flex-col items-center justify-between p-3.5 text-center select-none">
                <div>
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-[#C01E30] bg-[#C01E30]/10 border border-[#C01E30]/20 px-2 py-0.5 rounded-full">
                    ENTRY STUB
                  </span>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 font-semibold truncate max-w-[130px]">
                    {ticketCode}
                  </p>
                </div>

                {/* QR Code */}
                <div className="p-1.5 bg-white rounded-lg shadow-sm my-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`Ticket QR ${ticketCode}`}
                    className="w-24 h-24 object-contain"
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-400 block font-mono">SCAN AT GATE</span>
                  <span className="text-[9px] font-semibold text-zinc-300 block">
                    ADMIT: 01 PERSON
                  </span>
                </div>
              </div>
            }
          >
            {/* Ticket Body Content */}
            <div className="h-full flex flex-col justify-between p-5 text-left select-none relative overflow-hidden">
              {/* Watermark Logo */}
              <div className="absolute right-2 -bottom-4 opacity-5 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/edc-logo-dark.webp" alt="" className="w-48 h-auto" />
              </div>

              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C01E30]" />
                  <span className="text-[11px] font-extrabold tracking-wider text-zinc-200 uppercase font-mono">
                    EDC AITR CONCLAVE
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#C01E30] uppercase tracking-wider px-2 py-0.5 rounded bg-[#C01E30]/10 border border-[#C01E30]/20">
                  {category} PASS
                </span>
              </div>

              {/* Event Title */}
              <div className="my-auto py-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight line-clamp-2">
                  {eventTitle}
                </h2>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-medium">
                  📍 {eventVenue || 'Campus Auditorium, Acropolis'}
                </p>
              </div>

              {/* Bottom Meta */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    DELEGATE
                  </span>
                  <span className="font-bold text-white truncate block text-xs">
                    {attendeeName}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    SCHEDULE
                  </span>
                  <span className="font-semibold text-zinc-200 text-[11px] block truncate">
                    {dateFormatted}
                  </span>
                </div>
              </div>

              {/* Admitted Stamp when torn */}
              {isTorn && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-500/80 text-emerald-400 px-4 py-1.5 rounded-lg -rotate-12 font-black tracking-widest text-sm bg-black/60 backdrop-blur-sm pointer-events-none shadow-xl shadow-emerald-950/40">
                  ★ ADMITTED ★
                </div>
              )}
            </div>
          </TearTicket>

          {!isTorn && (
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              💡 Tip: Drag and pull the right stub to tear the ticket, or wait for gate scan.
            </p>
          )}
        </div>
      )}

      {/* ── MODE 2: KIOSK RECEIPT PRINTER ── */}
      {viewMode === 'printer' && (
        <div style={{ display: 'grid', gap: 24, justifyItems: 'center', width: '100%', margin: '0 auto' }}>
          <ReceiptPrinter.Root stage={stage} feedMotion="stepped">
            <ReceiptPrinter.Machine>
              <ReceiptPrinter.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/edc-logo-dark.webp"
                    alt="EDC Logo"
                    width={59}
                    height={20}
                    decoding="async"
                    style={{ height: 20, width: 'auto', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fafafc' }}>
                    PASS DISPENSER
                  </span>
                </div>
                <span className="mono-meta" style={{ color: '#c01e30', fontWeight: 700, fontSize: '0.72rem' }}>
                  #EDC-TKT
                </span>
              </ReceiptPrinter.Header>

              <ReceiptPrinter.Screen>
                <ReceiptPrinter.Status />
              </ReceiptPrinter.Screen>
            </ReceiptPrinter.Machine>

            <ReceiptPrinter.Output>
              <ReceiptPrinter.Paper>
                <div className="pvr-ticket-header">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/edc-logo-light.png"
                      alt="Entrepreneurship Development Cell · Acropolis"
                      style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="pvr-admit-badge">★ OFFICIAL ADMISSION PASS ★</div>
                  <div style={{ fontSize: '0.6875rem', color: '#686d7a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    REF: PVR-EDC-{ticketCode.slice(-8)}
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c01e30', fontWeight: 700 }}>
                    {category.toUpperCase()} ACCESS
                  </div>
                  <h2 className="pvr-title">{eventTitle}</h2>
                </div>

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
                    <div className="pvr-value" style={{ color: '#c01e30' }}>
                      01 PERSON
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div className="pvr-label">TICKET HOLDER</div>
                    <div className="pvr-value" style={{ fontSize: '0.875rem' }}>
                      {attendeeName}
                    </div>
                  </div>
                </div>

                <div className="pvr-perforation" aria-hidden="true">
                  <div className="pvr-perforation-line" />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#111318', marginBottom: 8 }}>
                    ENTRY VERIFICATION STUB
                  </div>

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

                  <p className="pvr-fineprint">
                    Entrepreneurship Development Cell (EDC) · Acropolis Institute of Technology &amp; Research (AITR)
                    <br />
                    Non-transferable · Valid with college photo ID · Admission subject to venue rules
                  </p>
                </div>
              </ReceiptPrinter.Paper>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Root>
        </div>
      )}

      {/* Action Buttons */}
      <div className="print-hide flex flex-wrap gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-[#C01E30] hover:bg-[#a81828] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Pass
        </button>

        <a
          href={qrDataUrl}
          download={`ticket-${ticketCode}.png`}
          className="px-4 py-2 rounded-xl border border-border/60 bg-background hover:bg-secondary text-foreground text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save QR Code
        </a>

        {viewMode === 'printer' && (
          <button
            type="button"
            onClick={runPrintAnimation}
            className="px-4 py-2 rounded-xl border border-border/60 bg-background hover:bg-secondary text-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Re-feed Ticket
          </button>
        )}
      </div>

      <p className="mono-meta print-hide text-center text-xs text-muted-foreground pt-1">
        {emailSentAt
          ? `✓ Ticket pass was emailed to your inbox on ${new Date(emailSentAt).toLocaleString('en-IN')}`
          : '✓ Present this digital pass or printed copy at the gate on the event day.'}
      </p>
    </div>
  );
}
