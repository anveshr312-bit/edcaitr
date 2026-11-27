import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project-id')) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type EventStatus =
  | 'draft'
  | 'published'
  | 'ongoing'
  | 'wrap_up'
  | 'closed'
  | 'archived'
  | 'cancelled';

export interface PublicTeamMember {
  id: string;
  full_name: string;
  bio: string | null;
  designation: string | null;
  linkedin_url: string | null;
  avatar_ref: string | null;
  role: 'director' | 'advisor' | 'core_team';
  effective_from: string | null;
  display_order: number;
}

export interface PublicPastTeamMember {
  full_name: string;
  designation: string | null;
  linkedin_url: string | null;
  avatar_ref: string | null;
  role: 'director' | 'advisor' | 'core_team';
  effective_from: string | null;
  effective_until: string | null;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  venue: string | null;
  starts_at: string | null;
  ends_at: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  status: EventStatus;
  is_paid: boolean;
  fee_amount: number | null;
  poster_ref: string | null;
  max_capacity: number | null;
  cancellation_reason?: string | null;
  planning_stage?: string | null;
}

export interface PublicEventGuest {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  linkedin_url: string | null;
  photo_ref: string | null;
  display_order: number;
}

export interface PublicEventHighlight {
  id: string;
  title: string;
  caption: string | null;
  media_type: 'image' | 'video';
  media_ref: string;
  display_order: number;
}

export interface PublicEventManual {
  id: string;
  title: string;
  description: string | null;
  file_ref: string;
  file_size_kb: number | null;
}

export const getPublicTeamProfiles = cache(
  async (): Promise<PublicTeamMember[]> => {
    const supabase = createPublicClient();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_public_team_profiles');
    if (data && data.length > 0) return data as PublicTeamMember[];

    // Fallback: Query all approved director, advisor, and core_team members directly
    // so any member who created their account automatically populates into EDC ANCHORS
    const { data: directMembers } = await supabase
      .from('org_memberships')
      .select('user_id, role, effective_from, profiles!user_id(id, full_name, bio, designation, linkedin_url, avatar_ref, display_order)')
      .eq('status', 'approved')
      .in('role', ['director', 'advisor', 'core_team'])
      .is('effective_until', null);

    if (directMembers && directMembers.length > 0) {
      return directMembers.map((m: any) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return {
          id: p?.id ?? m.user_id,
          full_name: p?.full_name || 'Team Member',
          bio: p?.bio ?? null,
          designation: p?.designation ?? null,
          linkedin_url: p?.linkedin_url ?? null,
          avatar_ref: p?.avatar_ref ?? null,
          role: m.role as 'director' | 'advisor' | 'core_team',
          effective_from: m.effective_from ?? null,
          display_order: p?.display_order ?? 10,
        };
      });
    }

    return [];
  }
);

export const getPublicPastTeams = cache(
  async (): Promise<PublicPastTeamMember[]> => {
    const supabase = createPublicClient();
    if (!supabase) return [];
    const { data } = await supabase.rpc('get_public_past_teams');
    return (data as PublicPastTeamMember[]) ?? [];
  }
);

export const getPublicEvents = cache(
  async (includeArchived = false): Promise<PublicEvent[]> => {
    const supabase = createPublicClient();
    if (!supabase) return [];

    const statuses: EventStatus[] = includeArchived
      ? ['published', 'ongoing', 'wrap_up', 'closed', 'archived', 'cancelled']
      : ['published', 'ongoing', 'wrap_up', 'closed', 'cancelled'];

    let { data, error } = await supabase
      .from('events')
      .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity, cancellation_reason, planning_stage')
      .or('audience.eq.public,audience.is.null')
      .in('status', statuses)
      .order('starts_at', { ascending: false, nullsFirst: false });

    if (error && (error.code === '42703' || String(error.message).includes('cancellation_reason'))) {
      const fallback = await supabase
        .from('events')
        .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity')
        .or('audience.eq.public,audience.is.null')
        .in('status', statuses)
        .order('starts_at', { ascending: false, nullsFirst: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('getPublicEvents query error:', error);
      return [];
    }

    return (data as PublicEvent[]) ?? [];
  }
);

export const getPublicEventBySlug = cache(
  async (slug: string): Promise<{
    event: PublicEvent | null;
    guests: PublicEventGuest[];
    highlights: PublicEventHighlight[];
    manuals: PublicEventManual[];
  }> => {
    const supabase = createPublicClient();
    if (!supabase) return { event: null, guests: [], highlights: [], manuals: [] };

    let { data: event, error } = await supabase
      .from('events')
      .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity, cancellation_reason, planning_stage')
      .eq('slug', slug)
      .in('status', ['published', 'ongoing', 'wrap_up', 'closed', 'archived', 'cancelled', 'draft'])
      .maybeSingle();

    if (error && (error.code === '42703' || String(error.message).includes('cancellation_reason'))) {
      const fallback = await supabase
        .from('events')
        .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity')
        .eq('slug', slug)
        .in('status', ['published', 'ongoing', 'wrap_up', 'closed', 'archived', 'cancelled', 'draft'])
        .maybeSingle();
      event = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('getPublicEventBySlug query error for slug', slug, ':', error);
      return { event: null, guests: [], highlights: [], manuals: [] };
    }

    if (!event) return { event: null, guests: [], highlights: [], manuals: [] };

    const [{ data: guests }, { data: highlights }, { data: manuals }] = await Promise.all([
      supabase.rpc('get_public_event_guests', { p_event_id: event.id }),
      supabase.rpc('get_public_event_highlights', { p_event_id: event.id }),
      supabase.rpc('get_public_event_manuals', { p_event_id: event.id }),
    ]);

    return {
      event: event as PublicEvent,
      guests: (guests as PublicEventGuest[]) ?? [],
      highlights: (highlights as PublicEventHighlight[]) ?? [],
      manuals: (manuals as PublicEventManual[]) ?? [],
    };
  }
);
