'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

type Step = 'check' | 'enroll' | 'verify' | 'done';

export default function MfaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/workspace';
  const isRequired = searchParams.get('required') === '1';

  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<Step>('check');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [totp, setTotp] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(async ({ data }) => {
      if (data?.currentLevel === 'aal2') {
        setStep('done');
        setMessage('Authenticator MFA is already verified for this session.');
      } else if (data?.nextLevel === 'aal2') {
        setStep('verify');
        await startChallenge();
      } else {
        // Automatically start enrollment so director gets QR code instantly
        setStep('enroll');
        await autoEnroll();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [step]);

  async function autoEnroll() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'EDC AITR',
        friendlyName: 'Director Authenticator',
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('verify');
      await startChallenge(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not initialize authenticator setup.');
    } finally {
      setBusy(false);
    }
  }

  async function startChallenge(fid?: string) {
    if (!supabase) return;
    try {
      let id = fid ?? factorId;
      if (!id) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.[0];
        if (!totpFactor) return;
        id = totpFactor.id;
        setFactorId(id);
      }
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: id });
      if (error) throw error;
      setChallengeId(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Challenge failed.');
    }
  }

  async function verify() {
    if (!supabase || !factorId || !challengeId || totp.length !== 6) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: totp });
      if (error) throw error;
      setStep('done');
      setMessage('Authenticator code verified! Director governance access is active.');
      setTotp('');
      setTimeout(() => {
        router.push(nextUrl);
      }, 1200);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Invalid authenticator code. Check your app clock and try again.'
      );
      setTotp('');
      // Generate new challenge on failure
      try {
        const { data: newCh } = await supabase.auth.mfa.challenge({ factorId });
        if (newCh) setChallengeId(newCh.id);
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-[620px] px-4 py-8 sm:px-6 sm:py-16">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Account</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">Director Security Verification</span>
        </div>

        {isRequired && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-3 w-3" />
            <span>Mandatory Verification</span>
          </span>
        )}
      </div>

      {/* Main Title Card */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87] mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Institutional Governance Gate</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Director Security Verification
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          Director-level authorizations require immediate authenticator-app verification upon login to prevent unauthorized approvals and access.
        </p>
      </div>

      {step === 'check' && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#C01E30]" />
          <span>Verifying session security posture…</span>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          {qrCode && (
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C01E30]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C01E30]/10 text-[11px]">
                  1
                </span>
                <span>Scan QR in Authenticator App (One-Time Setup)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="rounded-xl border border-border/60 bg-white p-3 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="TOTP Setup QR Code"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-lg"
                  />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="text-xs font-semibold text-foreground">
                    Google Authenticator / Authy / Microsoft
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Open your authenticator app, tap (+) to add account, and scan this QR code. Or enter secret manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-center font-mono text-xs tracking-wider text-foreground select-all">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C01E30]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C01E30]/10 text-[11px]">
                {qrCode ? '2' : '1'}
              </span>
              <span>Write the Authenticator Code</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Write the 6-digit code shown in your authenticator app to authorize your session:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
              className="flex flex-col sm:flex-row items-center gap-3 pt-1"
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000 000"
                autoComplete="one-time-code"
                className="w-full sm:w-52 rounded-xl border border-border/60 bg-background px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.25em] text-foreground placeholder:text-muted-foreground/40 focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />

              <button
                type="submit"
                disabled={busy || totp.length !== 6}
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-8 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#9E1625] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Verify &amp; Enter</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                Security Verification Complete
              </h2>
              <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                {message || 'Director-level security assurance is active. Redirecting…'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/workspace"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#C01E30] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625]"
            >
              Enter Workspace →
            </Link>
            <Link
              href="/account/applications"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border/60 bg-background px-5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Review Applications Queue →
            </Link>
          </div>
        </div>
      )}

      {message && step !== 'done' && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
