'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

type Step = 'check' | 'enroll' | 'verify' | 'done' | 'already_enrolled';

export default function MfaPage() {
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

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.currentLevel === 'aal2') {
        setStep('done');
        setMessage('MFA is already verified for this session.');
      } else if (data?.nextLevel === 'aal2') {
        setStep('verify');
        startChallenge();
      } else {
        setStep('enroll');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function startEnroll() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'EDC AITR',
        friendlyName: 'Director TOTP',
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('verify');
      await startChallenge(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Enrollment failed.');
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
      setMessage('MFA verified. Director-gated actions are now authorized for this session.');
      setTotp('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Verification failed. Check the code and try again.');
      setTotp('');
      await startChallenge();
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/account/dashboard"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Director MFA</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Director Governance Security</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Two-Factor Authentication (TOTP)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Director-gated actions (such as team appointments, suspensions, and nominations) require time-based authenticator verification.
        </p>
      </div>

      {/* Main Content by Step */}
      {step === 'check' && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-12 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#C01E30]" />
          <span>Checking MFA authorization status…</span>
        </div>
      )}

      {step === 'enroll' && (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C01E30]/10 text-[#C01E30]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Connect Authenticator App
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Works with Google Authenticator, Microsoft Authenticator, 1Password, or Authy
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              To activate Director governance permissions, link your mobile authenticator. Click below to generate your unique cryptographic QR code and manual setup secret.
            </p>

            <button
              onClick={startEnroll}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Secret…</span>
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  <span>Generate Setup QR Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          {qrCode && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C01E30]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C01E30]/10 text-[11px]">
                  1
                </span>
                <span>Scan QR in Authenticator App</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="TOTP Setup QR Code"
                    width={180}
                    height={180}
                    className="h-44 w-44 rounded-lg"
                  />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="text-xs font-semibold text-[var(--color-2-mood)]">
                    Cannot scan the QR code?
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter this secret key manually into your authenticator app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2 text-center font-mono text-xs tracking-wider text-[var(--color-2-mood)] select-all">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 text-xs font-medium text-[var(--color-2-mood)] hover:bg-[var(--surface)] transition-colors"
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

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C01E30]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C01E30]/10 text-[11px]">
                {qrCode ? '2' : '1'}
              </span>
              <span>Enter 6-Digit Authenticator Code</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                className="w-full sm:w-48 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-[var(--color-2-mood)] placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />

              <button
                type="button"
                onClick={verify}
                disabled={busy || totp.length !== 6}
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                MFA Verified &amp; Active
              </h2>
              <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                {message || 'Director-level security assurance is active for this session.'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/account/team"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#C01E30] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625]"
            >
              Proceed to Team &amp; Tenure Management →
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
