'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  UtensilsCrossed,
  ShieldAlert,
} from 'lucide-react';
import TearTicket from '../../../../components/ui/TearTicket';
import {
  type FoodCoupon,
  type MealType,
  MEAL_THEMES,
} from '../../../../lib/events/foodCoupons';

interface Props {
  initialCoupons: FoodCoupon[];
  registrationId: string;
}

export default function FoodCouponsSection({ initialCoupons, registrationId }: Props) {
  const [coupons, setCoupons] = useState<FoodCoupon[]>(initialCoupons);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Generate QR Data URLs for all coupon tokens
  useEffect(() => {
    let active = true;
    async function makeQrs() {
      const qrs: Record<string, string> = {};
      for (const c of coupons) {
        try {
          const url = await QRCode.toDataURL(c.qr_token, {
            width: 200,
            margin: 1,
            color: { dark: '#0a0a0c', light: '#ffffff' },
          });
          qrs[c.id] = url;
        } catch {}
      }
      if (active) setQrImages(qrs);
    }
    void makeQrs();
    return () => {
      active = false;
    };
  }, [coupons]);

  // Live polling (every 2.5s) to auto-tear coupon when scanned at the counter
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/registrations/${registrationId}/food-coupons`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coupons)) {
            setCoupons(data.coupons);
            setLastSync(new Date());
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [registrationId]);

  if (!coupons || coupons.length === 0) {
    return null;
  }

  const redeemedCount = coupons.filter((c) => c.status === 'redeemed').length;

  return (
    <div className="mt-10 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Event Food Coupons ({coupons.length})</span>
          </div>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--color-2-mood)]">
            Meal Entitlements &amp; Food Passes
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Present the meal QR at the catering desk. The ticket automatically tears on scan. Manual tearing is disabled.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sync Active</span>
          <span className="rounded-md border border-[var(--border-hairline)] px-2 py-0.5 text-[11px]">
            {redeemedCount} / {coupons.length} Redeemed
          </span>
        </div>
      </div>

      {/* Grid of Color-Coded Meal Coupons */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {coupons.map((coupon) => {
          const theme = MEAL_THEMES[coupon.meal_type] || MEAL_THEMES.lunch;
          const isRedeemed = coupon.status === 'redeemed';
          const qrSrc = qrImages[coupon.id];

          return (
            <div
              key={coupon.id}
              className="flex flex-col items-center justify-center rounded-2xl p-4 transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isRedeemed ? 'var(--border-hairline)' : theme.badgeBorder}`,
              }}
            >
              {/* Header Badge */}
              <div className="mb-3 flex w-full items-center justify-between px-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: theme.badgeBg,
                    color: theme.brandColor,
                    border: `1px solid ${theme.badgeBorder}`,
                  }}
                >
                  <span>{theme.icon}</span>
                  <span>{coupon.meal_title}</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                    isRedeemed
                      ? 'text-rose-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isRedeemed ? (
                    <>
                      <ShieldAlert className="h-3 w-3" />
                      <span>REDEEMED</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>VALID · READY TO SCAN</span>
                    </>
                  )}
                </span>
              </div>

              {/* The React Bits TearTicket Component */}
              <div className="relative select-none overflow-hidden py-1">
                <TearTicket
                  width={380}
                  height={190}
                  stubSize={115}
                  radius={14}
                  holes={10}
                  holeSize={6}
                  notch={3}
                  roughness={0}
                  background={theme.darkBg}
                  color={theme.lightText}
                  border={true}
                  borderWidth={1}
                  disabled={true} /* Participants cannot manually tear! */
                  torn={isRedeemed} /* Automatically tears on scan! */
                  stub={
                    <div className="flex h-full w-full flex-col items-center justify-between p-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#A0A6B2]">
                        Meal Stub
                      </div>
                      <div
                        className="my-auto flex flex-col items-center justify-center rounded-lg p-1.5"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        <span className="text-xl">{theme.icon}</span>
                        <span
                          className="mt-1 text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: theme.brandColor }}
                        >
                          {coupon.meal_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[9px] font-medium leading-tight text-[#A0A6B2]">
                        {isRedeemed ? (
                          <span className="font-bold text-rose-400">USED</span>
                        ) : (
                          <span>Scan to Tear</span>
                        )}
                      </div>
                    </div>
                  }
                >
                  {/* Coupon Body */}
                  <div className="flex h-full w-full items-center justify-between gap-3 p-4">
                    {/* Left details */}
                    <div className="flex flex-col justify-between h-full text-left py-0.5">
                      <div>
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: theme.brandColor }}
                        >
                          EDC AITR CATERING PASS
                        </div>
                        <h4 className="mt-1 text-sm font-bold leading-tight" style={{ color: theme.lightText }}>
                          {coupon.meal_title}
                        </h4>
                        <div className="mt-1 text-[11px] text-[#A0A6B2] line-clamp-1">
                          {coupon.event_title}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-[9px] uppercase tracking-wider text-[#A0A6B2]">
                          Attendee
                        </div>
                        <div className="text-xs font-semibold" style={{ color: theme.lightText }}>
                          {coupon.participant_name}
                        </div>
                        <div className="font-mono text-[9px] text-[#A0A6B2] mt-0.5">
                          {coupon.coupon_code}
                        </div>
                      </div>
                    </div>

                    {/* Right: QR Code for Counter Scanner */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-2 shadow-sm shrink-0">
                      {qrSrc ? (
                        <img
                          src={qrSrc}
                          alt="Food Coupon QR"
                          className="h-20 w-20 object-contain rounded"
                        />
                      ) : (
                        <div className="h-20 w-20 animate-pulse bg-gray-200 rounded" />
                      )}
                      <span className="mt-1 text-[8px] font-mono font-bold text-black tracking-tight">
                        COUNTER SCAN
                      </span>
                    </div>
                  </div>
                </TearTicket>
              </div>

              {/* Status info beneath card */}
              <div className="mt-3 text-center text-[11px] text-[var(--text-muted)]">
                {isRedeemed ? (
                  <span className="text-rose-500 font-medium">
                    ✓ Redeemed on {coupon.redeemed_at ? new Date(coupon.redeemed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'counter scan'} · Single entry closed
                  </span>
                ) : (
                  <span>
                    Valid for single redemption at the food counter · Tears upon coordinator scan
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
