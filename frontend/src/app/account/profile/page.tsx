'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface Profile {
  full_name: string;
  phone: string;
  bio: string;
  designation: string;
  linkedin_url: string;
  college: string;
  enrollment_no: string;
  is_public: boolean;
}

const EMPTY: Profile = {
  full_name: '', phone: '', bio: '', designation: '',
  linkedin_url: '', college: '', enrollment_no: '', is_public: false,
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
          .select('full_name,phone,bio,designation,linkedin_url,college,enrollment_no,is_public')
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
      // Validate LinkedIn URL
      if (profile.linkedin_url && !/^https?:\/\//i.test(profile.linkedin_url)) {
        throw new Error('LinkedIn URL must start with https://');
      }
      const payload: Record<string, unknown> = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim() || null,
        bio: profile.bio.trim() || null,
        linkedin_url: profile.linkedin_url.trim() || null,
        college: profile.college.trim() || null,
        enrollment_no: profile.enrollment_no.trim() || null,
      };
      if (canManageDisplay) {
        payload.designation = profile.designation.trim() || null;
        payload.is_public = profile.is_public;
      }
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);
      if (error) throw error;
      setMessage('Profile saved successfully.');
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading profile…</p>;
  if (!userId) return <p>Please <a href="/account">sign in</a> to edit your profile.</p>;

  return (
    <>
      <h1>Edit Profile</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Your profile is used in the internal member directory and, when{' '}
        <strong>Show on public Team page</strong> is on, the public Team page.
        Administrative roles are managed separately.
      </p>
      <form onSubmit={save}>
        <label>
          Full name *
          <input
            type="text" required maxLength={120}
            value={profile.full_name} onChange={field('full_name')}
            autoComplete="name"
          />
        </label>

        <label>
          Phone
          <input
            type="tel" maxLength={20}
            value={profile.phone} onChange={field('phone')}
            autoComplete="tel" placeholder="Optional"
          />
        </label>

        <label>
          College / Organisation
          <input
            type="text" maxLength={200}
            value={profile.college} onChange={field('college')}
            placeholder="Optional"
          />
        </label>

        <label>
          Enrollment number
          <input
            type="text" maxLength={40}
            value={profile.enrollment_no} onChange={field('enrollment_no')}
            placeholder="Optional — not required for external participants"
          />
        </label>

        <label>
          Designation
          <input
            type="text" maxLength={100}
            value={profile.designation} onChange={field('designation')}
            placeholder="e.g. Frontend Lead, Event Head"
          />
        </label>

        <label>
          LinkedIn / Social profile URL
          <input
            type="url" maxLength={300}
            value={profile.linkedin_url} onChange={field('linkedin_url')}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </label>

        <label>
          Short bio
          <textarea
            maxLength={500} rows={4}
            value={profile.bio} onChange={field('bio')}
            placeholder="A short description shown on the Team page (optional)"
            style={{ font: 'inherit', padding: 10, resize: 'vertical' }}
          />
        </label>

        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10, display: 'flex' }}>
          <input
            type="checkbox"
            checked={profile.is_public}
            onChange={e => setProfile(prev => ({ ...prev, is_public: e.target.checked }))}
            style={{ width: 'auto', padding: 0 }}
          />
          Show on public Team page
        </label>

        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      {message && (
        <p role="status" aria-live="polite" style={{ color: isError ? '#c62828' : '#2e7d32', marginTop: 12 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/account/dashboard">← Back to dashboard</a>
      </p>
    </>
  );
}
