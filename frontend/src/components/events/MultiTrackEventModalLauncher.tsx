'use client';

import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { DynamicTrackRegistrationModal } from './DynamicTrackRegistrationModal';
import { EventItem, Registration } from '../../types/portal';
import { SEED_EVENTS } from '../../data/seedData';

interface Props {
  eventId: string;
  eventTitle: string;
  isPaid: boolean;
  feeAmount: number | null;
  defaultName?: string;
  defaultEmail?: string;
}

export function MultiTrackEventModalLauncher({
  eventId,
  eventTitle,
  isPaid,
  feeAmount,
  defaultName = '',
  defaultEmail = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [completedReg, setCompletedReg] = useState<Registration | null>(null);

  // Match seeded event for rich track metadata or construct fallback EventItem
  const seeded = SEED_EVENTS.find((e) => e.id === eventId || e.title.toLowerCase() === eventTitle.toLowerCase());
  const baseEvent = SEED_EVENTS[0];

  const eventItem: EventItem = seeded || {
    ...baseEvent,
    id: eventId,
    slug: eventId,
    title: eventTitle,
    subtitle: 'Innovation Summit Track Series',
    isPaid: Boolean(isPaid),
    feeInr: isPaid && feeAmount ? feeAmount : 0,
    tracks: baseEvent.tracks,
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border-hairline)]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[9px] bg-[var(--surface-subtle)] hover:bg-[var(--accent-tint)] border border-[var(--border-hairline)] hover:border-[var(--color-3-accent-personality)] text-[var(--color-2-mood)] font-semibold text-xs tracking-tight transition-all duration-200 cursor-pointer shadow-sm"
      >
        <Layers className="h-4 w-4 text-[var(--color-3-accent-personality)]" />
        <span>Explore Multi-Track Categories &amp; Pricing</span>
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--accent-tint)] text-[var(--color-3-accent-personality)]">
          {eventItem.tracks?.length || 3} Tracks
        </span>
      </button>

      {completedReg && (
        <div className="mt-3 p-3 rounded-[9px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
          <p className="font-semibold">Track Registration Confirmed!</p>
          <p className="mt-0.5 text-[11px] opacity-80">Reference ID: {completedReg.id}</p>
        </div>
      )}

      {open && (
        <DynamicTrackRegistrationModal
          open={open}
          onClose={() => setOpen(false)}
          event={eventItem}
          registrations={[]}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          onSubmitRegistration={(payload) => {
            const reg: Registration = {
              id: `reg-${Date.now()}`,
              eventId: payload.eventId,
              userId: 'guest',
              attendeeName: payload.attendeeName,
              attendeeEmail: payload.attendeeEmail,
              enrollmentNo: payload.enrollmentNo,
              paymentStatus: isPaid ? 'Pending Payment Verification' : 'Free',
              ticketToken: `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              checkInStatus: 'Not Checked In',
              seatSlot: 'T-01',
              registeredAt: new Date().toISOString(),
              trackId: payload.trackId,
              utrNumber: payload.utrNumber,
              formResponses: payload.formResponses,
            };
            setCompletedReg(reg);
            return reg;
          }}
          onCompleted={(reg) => {
            setCompletedReg(reg);
          }}
          onNotify={(title, detail) => {
            console.log(`[Registration Modal] ${title}: ${detail}`);
          }}
        />
      )}
    </div>
  );
}
