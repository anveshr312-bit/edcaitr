'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

interface ScanResult {
  ok: boolean;
  message: string;
  detail?: string;
}

export default function CheckinClient({ eventId }: { eventId: string }) {
  const [tokenInput, setTokenInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function processToken(rawToken: string) {
    const token = rawToken.trim();
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          message: data.error ?? 'Check-in rejected.',
          detail: data.participant_name ? `${data.participant_name} (${data.ticket_code})` : undefined,
        });
      } else {
        setResult({
          ok: true,
          message: `Checked in: ${data.participant_name} (${data.ticket_code})`,
          detail: data.sheets_synced
            ? 'Synced to Google Sheets.'
            : data.sheets_note || 'Recorded in portal.',
        });
      }
      setTokenInput('');
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error during check-in.',
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
  }, [cameraOn, busy]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 520 }}>
      <div className="card">
        <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <label>
            QR Token (UUID)
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan or paste ticket QR token"
              autoFocus
            />
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy || !tokenInput.trim()}>
              {busy ? 'Checking in…' : 'Check In'}
            </button>
            <button type="button" onClick={() => void toggleCamera()}>
              {cameraOn ? 'Stop Camera' : 'Use Camera Scanner'}
            </button>
          </div>
        </form>
      </div>

      {cameraOn && (
        <div className="card" style={{ padding: 12 }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', borderRadius: 8, background: '#111318' }}
          />
        </div>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="card"
          style={{
            borderColor: result.ok ? 'var(--success)' : 'var(--danger)',
            background: 'var(--surface)',
          }}
        >
          <strong style={{ color: result.ok ? 'var(--success)' : 'var(--danger)' }}>
            {result.message}
          </strong>
          {result.detail && <span className="mono-meta">{result.detail}</span>}
        </div>
      )}
    </div>
  );
}
