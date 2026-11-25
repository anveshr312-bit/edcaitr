'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';
import ImageUploadField from '../../../components/ImageUploadField';

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
}

const EMPTY: Profile = {
  full_name: '', phone: '', bio: '', designation: '',
  linkedin_url: '', avatar_ref: '', college: '', enrollment_no: '', is_public: false,
};

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [canManageDisplay, setCanManageDisplay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) { setLoading(false); return; }
      setUserId(data.user.id);
      const [{ data: p }, { data: roleData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name,phone,bio,designation,linkedin_url,avatar_ref,college,enrollment_no,is_public')
          .eq('id', data.user.id)
          .single(),
        supabase.rpc('get_user_role', { user_uuid: data.user.id }),
      ]);
      if (p) setProfile(p as Profile);
      setCanManageDisplay(roleData === 'advisor' || roleData === 'director');
      setLoading(false);
    });
  }, [supabase]);

  function field(key: keyof Profile) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile(prev => ({ ...prev, [key]: e.target.value }));
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !userId) return;
    setBusy(true); setMessage(''); setIsError(false);
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
      const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
      if (error) throw error;
      setMessage('Profile saved successfully.');
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-muted)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Loading profile…
    </div>
  );
  if (!userId) return (
    <div className="card" style={{ maxWidth: 400, margin: '48px auto', textAlign: 'center' }}>
      <p style={{ margin: 0 }}>Please <a href="/account">sign in</a> to edit your profile.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Dark header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.5)', margin: '0 0 8px' }}>
          Account
        </p>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>
          Edit Profile
        </h1>
        <p style={{ margin: '12px 0 0', color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 560 }}>
          Used in the internal member directory. When{' '}
          <strong style={{ color: '#fff' }}>Show on public Team page</strong> is on,
          your info appears on the public Team page.
        </p>
      </div>

      <form onSubmit={save} style={{ display: 'grid', gap: 20, maxWidth: 600 }}>
        {/* Identity section */}
        <div>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 14px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 10 }}>
            Identity
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Full name *</span>
              <input type="text" required maxLength={120} value={profile.full_name} onChange={field('full_name')} autoComplete="name" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>College / Organisation</span>
              <input type="text" maxLength={200} value={profile.college} onChange={field('college')} placeholder="Optional" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Enrollment number</span>
              <input type="text" maxLength={40} value={profile.enrollment_no} onChange={field('enrollment_no')} placeholder="Optional — not required for external participants" />
            </label>
          </div>
        </div>

        {/* Contact section */}
        <div>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 14px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 10 }}>
            Contact
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Phone</span>
              <input type="tel" maxLength={20} value={profile.phone} onChange={field('phone')} autoComplete="tel" placeholder="Optional" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>LinkedIn / Social profile URL</span>
              <input type="url" maxLength={300} value={profile.linkedin_url} onChange={field('linkedin_url')} placeholder="https://linkedin.com/in/yourprofile" />
            </label>
          </div>
        </div>

        {/* Profile section */}
        <div>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 14px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 10 }}>
            Public Profile
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {canManageDisplay && (
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Designation</span>
                <input type="text" maxLength={100} value={profile.designation} onChange={field('designation')} placeholder="e.g. Frontend Lead, Event Head" />
              </label>
            )}
            <ImageUploadField
              label="Profile Photo"
              folder="avatars"
              value={profile.avatar_ref ?? ''}
              onChange={(val) => setProfile(prev => ({ ...prev, avatar_ref: val }))}
            />
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Short bio</span>
              <textarea
                maxLength={500}
                rows={4}
                value={profile.bio}
                onChange={field('bio')}
                placeholder="A short description shown on the Team page (optional)"
                style={{ font: 'inherit', padding: '10px 14px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }}
              />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10, display: 'flex', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.is_public}
                onChange={e => setProfile(prev => ({ ...prev, is_public: e.target.checked }))}
                style={{ width: 'auto', padding: 0, accentColor: 'var(--color-3-accent-personality)' }}
              />
              <span style={{ fontSize: 14 }}>Show on public Team page</span>
            </label>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ minWidth: 160 }}>
            {busy ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      {message && (
        <p role="status" aria-live="polite" style={{ margin: 0, color: isError ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
          {message}
        </p>
      )}

      <p>
        <a href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </p>
    </div>
  );
}
