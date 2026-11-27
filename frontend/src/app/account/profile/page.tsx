'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Globe,
  IdCard,
  Loader2,
  Phone,
  Save,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import ImageUploadField from '../../../components/ImageUploadField';
import { SmoothInput } from '../../../components/ui/SmoothInput';

interface Profile {
  full_name: string;
  phone: string;
  bio: string;
  designation: string;
  linkedin_url: string;
  avatar_ref: string;
  college: string;
  enrollment_no: string;
  is_public: boolean;
  domain?: string | null;
}

const EMPTY: Profile = {
  full_name: '',
  phone: '',
  bio: '',
  designation: '',
  linkedin_url: '',
  avatar_ref: '',
  college: '',
  enrollment_no: '',
  is_public: false,
  domain: null,
};

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('participant');
  const [canManageDisplay, setCanManageDisplay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);

      const [{ data: p }, { data: roleData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name,phone,bio,designation,linkedin_url,avatar_ref,college,enrollment_no,is_public,domain')
          .eq('id', data.user.id)
          .single(),
        supabase.rpc('get_user_role', { user_uuid: data.user.id }),
      ]);

      if (roleData) {
        setUserRole(roleData as string);
      }

      if (!p) {
        setProfile({
          ...EMPTY,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
        });
      } else {
        setProfile({
          ...EMPTY,
          ...Object.fromEntries(Object.entries(p).filter(([, value]) => value !== null)),
        });
      }

      const assurance =
        roleData === 'director' ? await supabase.auth.mfa.getAuthenticatorAssuranceLevel() : null;
      setCanManageDisplay(roleData === 'advisor' || assurance?.data?.currentLevel === 'aal2');
      setLoading(false);
    });
  }, [supabase]);

  function field(key: keyof Profile) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProfile((prev) => ({ ...prev, [key]: e.target.value }));
      if (message) setMessage('');
    };
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !userId) return;
    setBusy(true);
    setMessage('');
    setIsError(false);

    try {
      if (profile.linkedin_url && !/^https?:\/\//i.test(profile.linkedin_url)) {
        throw new Error('LinkedIn URL must start with https://');
      }

      const payload: Record<string, unknown> = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim() || null,
        bio: profile.bio.trim() || null,
        linkedin_url: profile.linkedin_url.trim() || null,
        avatar_ref: profile.avatar_ref.trim() || null,
        college: profile.college.trim() || null,
        enrollment_no: profile.enrollment_no.trim() || null,
      };

      if (canManageDisplay) {
        payload.designation = profile.designation.trim() || null;
        payload.is_public = profile.is_public;
      }

      if (userRole === 'core_team') {
        payload.domain = profile.domain || null;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...payload }, { onConflict: 'id' });

      if (error) throw error;
      setMessage('Profile updated successfully.');
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[880px] items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#C01E30]" />
          <span>Loading your profile…</span>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-8 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 text-[#C01E30]">
            <User className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)]">
            Sign In Required
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Please sign in to view and edit your profile credentials.
          </p>
          <div className="mt-6">
            <Link
              href="/account?next=/account/profile"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#C01E30] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#9E1625]"
            >
              Sign In to Continue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/account/dashboard"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Edit Profile</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C01E30]" />
              <span>Account Profile</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
              Edit Profile
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Manage your personal directory identity, academic affiliations, contact details, and public team roster visibility.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3 text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Current Role
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold capitalize text-[#C01E30] dark:text-[#E67C87]">
              <Shield className="h-3.5 w-3.5" />
              <span>{userRole.replace('_', ' ')}</span>
            </div>
            {userEmail && (
              <div className="mt-1 text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                {userEmail}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={save} className="space-y-8">
        {/* Section 1: Identity & Academic Information */}
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C01E30]/10 text-[#C01E30]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Identity &amp; Academic Affiliation
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Your full name and institutional credentials
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                Full name <span className="text-[#C01E30]">*</span>
              </label>
              <SmoothInput
                required
                maxLength={120}
                value={profile.full_name}
                onChange={field('full_name')}
                autoComplete="name"
                placeholder="e.g. Rohan Sharma"
                wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                College / Institution
              </label>
              <SmoothInput
                maxLength={200}
                value={profile.college}
                onChange={field('college')}
                placeholder="e.g. Acropolis Institute of Technology & Research"
                wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                Enrollment number
              </label>
              <SmoothInput
                maxLength={40}
                value={profile.enrollment_no}
                onChange={field('enrollment_no')}
                placeholder="Optional — for Acropolis students"
                wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
              />
            </div>

            {userRole === 'core_team' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                  EDC domain affiliation
                </label>
                <div className="relative">
                  <select
                    value={profile.domain ?? ''}
                    onChange={(e) => setProfile((prev) => ({ ...prev, domain: e.target.value || null }))}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Unassigned / To be decided</option>
                    <option value="research_digital">Research &amp; Digital Communications (Knowledge, Research &amp; Content)</option>
                    <option value="programs_experiences">Programs &amp; Experiences (Event Design, Speakers &amp; Live Production)</option>
                    <option value="partnerships_ecosystem">Partnerships &amp; Ecosystem Relations (Sponsorships, MoUs &amp; Outreach)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)]">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Choose your primary operating pillar within the EDC AITR Core Team structure. You can update this whenever your responsibilities rotate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Contact & Social Presence */}
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C01E30]/10 text-[#C01E30]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Contact &amp; Professional Links
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Ways for organizers, mentors, and fellow founders to reach you
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                Phone number
              </label>
              <SmoothInput
                type="tel"
                maxLength={20}
                value={profile.phone}
                onChange={field('phone')}
                autoComplete="tel"
                placeholder="+91 98765 43210"
                wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
              />
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                Used for urgent summit check-ins and WhatsApp coordination.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                LinkedIn profile URL
              </label>
              <SmoothInput
                type="url"
                maxLength={300}
                value={profile.linkedin_url}
                onChange={field('linkedin_url')}
                placeholder="https://linkedin.com/in/yourprofile"
                wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
              />
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                Must start with https://. Displayed on public speaker &amp; team cards.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Public Display & Team Roster */}
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C01E30]/10 text-[#C01E30]">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Public Profile &amp; Bio
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Visual card assets shown in directory and event rosters
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {canManageDisplay && (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-2-mood)] mb-1.5">
                  Official designation
                </label>
                <SmoothInput
                  maxLength={100}
                  value={profile.designation}
                  onChange={field('designation')}
                  placeholder="e.g. Lead Technical Architect, Convener, Event Head"
                  wrapperClassName="bg-[var(--surface-subtle)] border-[var(--border-hairline)]"
                />
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                  Available for Advisor &amp; Director verified administrative members.
                </p>
              </div>
            )}

            <div>
              <ImageUploadField
                label="Profile Photograph"
                folder="avatars"
                value={profile.avatar_ref ?? ''}
                onChange={(val) => setProfile((prev) => ({ ...prev, avatar_ref: val }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-2-mood)]">
                  Short bio
                </label>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {profile.bio.length} / 500
                </span>
              </div>
              <textarea
                maxLength={500}
                rows={4}
                value={profile.bio}
                onChange={field('bio')}
                placeholder="A brief introduction highlighting your domain experience, startup focus, or involvement with EDC AITR…"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none resize-y"
              />
            </div>

            {canManageDisplay && (
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={profile.is_public}
                    onChange={(e) => setProfile((prev) => ({ ...prev, is_public: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-hairline)] accent-[#C01E30] focus:ring-[#C01E30]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-2-mood)]">
                      Publish to official Team page
                    </span>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      When enabled, your profile card, photo, designation, and bio will appear on the public EDC AITR Team Directory.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              isError
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {isError ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            )}
            <div className="font-medium">{message}</div>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/portal/certificates"
              className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)] hover:text-[#C01E30]"
            >
              <span>View issued credentials</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
