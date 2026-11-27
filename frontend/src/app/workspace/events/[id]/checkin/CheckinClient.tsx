'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  ShieldAlert,
  Ticket,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { MEAL_THEMES, type MealType } from '../../../../../lib/events/foodCoupons';

interface ScanResult {
  ok: boolean;
  message: string;
  detail?: string;
  isAlreadyRedeemed?: boolean;
  mealTitle?: string;
}

export default function CheckinClient({ eventId }: { eventId: string }) {
  const [mode, setMode] = useState<'admission' | 'food'>('admission');
  const [selectedMeal, setSelectedMeal] = useState<MealType | 'all'>('all');
  const [tokenInput, setTokenInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Beep sound feedback on scan
  function playAudioFeedback(success: boolean) {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (success) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15); // A3
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {}
  }

  async function processToken(rawToken: string) {
    const token = rawToken.trim();
    if (!token) return;
    setBusy(true);

    // Auto-detect coupon mode if token starts with EDC-COUPON
    const isCouponToken = token.startsWith('EDC-COUPON:');
    const activeMode = isCouponToken ? 'food' : mode;
    if (isCouponToken && mode !== 'food') {
      setMode('food');
    }

    try {
      if (activeMode === 'food') {
        const res = await fetch(`/api/events/${eventId}/food-coupons/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token: token }),
        });
        const data = await res.json();

        if (!res.ok) {
          playAudioFeedback(false);
          setResult({
            ok: false,
            message: data.error ?? 'Redemption rejected.',
            detail: data.redeemed_at
              ? `Prior redemption timestamp: ${new Date(data.redeemed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Counter scan denied.',
            isAlreadyRedeemed: Boolean(data.is_already_redeemed),
            mealTitle: data.meal_title,
          });
        } else {
          playAudioFeedback(true);
          setResult({
            ok: true,
            message: data.message ?? 'Food Coupon Redeemed Successfully!',
            detail: `${data.meal_title} · Attendee: ${data.participant_name}`,
            mealTitle: data.meal_title,
          });
        }
      } else {
        const res = await fetch(`/api/events/${eventId}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token: token }),
        });
        const data = await res.json();
        if (!res.ok) {
          playAudioFeedback(false);
          setResult({
            ok: false,
            message: data.error ?? 'Check-in rejected.',
            detail: data.participant_name ? `${data.participant_name} (${data.ticket_code})` : undefined,
          });
        } else {
          playAudioFeedback(true);
          setResult({
            ok: true,
            message: `Checked in: ${data.participant_name} (${data.ticket_code})`,
            detail: data.sheets_synced
              ? 'Synced to Google Sheets.'
              : data.sheets_note || 'Recorded in portal.',
          });
        }
      }
      setTokenInput('');
    } catch (err) {
      playAudioFeedback(false);
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error during scan.',
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void processToken(tokenInput);
  }

  async function toggleCamera() {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }

    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      setResult({
        ok: false,
        message: 'Live camera BarcodeDetector is not supported in this browser. Use a handheld scanner or paste the QR token.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setResult({ ok: false, message: 'Camera permission denied or unavailable.' });
    }
  }

  useEffect(() => {
    if (!cameraOn) return;
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });

    const interval = setInterval(async () => {
      if (!active || !videoRef.current || busy) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0 && codes[0].rawValue) {
          await processToken(codes[0].rawValue);
        }
      } catch {
        // Ignore single-frame detection errors
      }
    }, 800);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, busy, mode]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-1.5">
        <button
          type="button"
          onClick={() => {
            setMode('admission');
            setResult(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'admission'
              ? 'bg-[#C01E30] text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--color-2-mood)]'
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Gate Admission Pass</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('food');
            setResult(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'food'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--color-2-mood)]'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>Food Coupon Counter</span>
        </button>
      </div>

      {/* Food Meal Filter Pills (When in Food mode) */}
      {mode === 'food' && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-3">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1">
            Active Session:
          </span>
          {(['all', 'breakfast', 'lunch', 'high_tea', 'dinner'] as const).map((m) => {
            const isSel = selectedMeal === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMeal(m)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  isSel
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] border border-transparent'
                }`}
              >
                {m === 'all' ? 'All Meals' : m.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Scanner Card */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              {mode === 'food' ? 'Food Coupon QR Token' : 'Gate Admission QR Token'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={
                  mode === 'food'
                    ? 'Scan coupon QR or paste EDC-COUPON:…'
                    : 'Scan or paste ticket QR token'
                }
                autoFocus
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--color-2-mood)] placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:outline-none focus:ring-1 focus:ring-[#C01E30]"
              />
              <QrCode className="absolute right-3.5 top-3.5 h-5 w-5 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || !tokenInput.trim()}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition-all disabled:opacity-50 ${
                mode === 'food'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#C01E30] hover:bg-[#a01828]'
              }`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'food' ? (
                <UtensilsCrossed className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{busy ? 'Verifying…' : mode === 'food' ? 'Redeem Meal Coupon' : 'Check In Attendee'}</span>
            </button>

            <button
              type="button"
              onClick={() => void toggleCamera()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-3 text-xs font-semibold text-[var(--color-2-mood)] hover:bg-[var(--surface)] transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>{cameraOn ? 'Stop Camera' : 'Camera Scanner'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Camera Viewfinder */}
      {cameraOn && (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-black p-3">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full rounded-xl object-cover aspect-video"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-48 w-48 rounded-2xl border-2 border-emerald-500/80 animate-pulse bg-emerald-500/10" />
          </div>
          <div className="mt-2 text-center text-[11px] text-gray-400">
            Center the participant's QR code in the viewfinder for instant verification
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border p-5 transition-all ${
            result.ok
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : result.isAlreadyRedeemed
              ? 'border-rose-500/40 bg-rose-500/15'
              : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.ok ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : result.isAlreadyRedeemed ? (
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <h4
                className={`text-sm font-bold ${
                  result.ok
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : result.isAlreadyRedeemed
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {result.message}
              </h4>

              {result.detail && (
                <p className="text-xs text-[var(--color-2-mood)] font-medium">
                  {result.detail}
                </p>
              )}

              {result.isAlreadyRedeemed && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>STRICT POLICY: Repeat meal denied to prevent double-claiming.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
