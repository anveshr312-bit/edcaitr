import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Award, Calendar, CheckCircle2, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ParticipantCertificatesPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const { data: certs } = await supabase
    .from('certificates')
    .select('id, certificate_code, title, issued_at, events(title, slug, starts_at)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Portal</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Certificates</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Award className="h-3.5 w-3.5" />
          <span>Verified Credentials</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Your Verified Certificates
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Cryptographically issued achievement credentials and official participation certificates for completed EDC AITR summits, hackathons, and bootcamps.
        </p>
      </div>

      {/* Certificates Grid */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        {!certs || certs.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No certificates issued yet
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Certificates are automatically generated and linked to your account once your attendance or award is verified by event organizers.
            </p>
            <div className="mt-6">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625]"
              >
                <span>Browse upcoming events</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {certs.map((c) => {
              const ev = Array.isArray(c.events) ? c.events[0] : c.events;
              return (
                <article
                  key={c.id}
                  className="relative overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-6 transition-all hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C01E30] dark:text-[#E67C87]">
                      {c.certificate_code}
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <h2 className="mt-3 text-base font-bold text-[var(--color-2-mood)]">
                    {c.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {ev?.title ?? 'EDC AITR Event'}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-[var(--border-hairline)] pt-4 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Issued {new Date(c.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <span className="font-semibold text-[#C01E30]">
                      EDC Verified ✓
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
