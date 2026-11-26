import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project-id')) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'wrap_up' | 'closed' | 'archived' | 'cancelled';

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
    const { data } = await supabase.rpc('get_public_team_profiles');
    return (data as PublicTeamMember[]) ?? [];
  }
);

export const getPublicPastTeams = unstable_cache(
  async (): Promise<PublicPastTeamMember[]> => {
    const supabase = createPublicClient();
    if (!supabase) return [];
    const { data } = await supabase.rpc('get_public_past_teams');
    return (data as PublicPastTeamMember[]) ?? [];
  },
  ['public-past-teams'],
  { revalidate: 60, tags: ['public-team'] }
);

export const getPublicEvents = unstable_cache(
  async (includeArchived = false): Promise<PublicEvent[]> => {
    const supabase = createPublicClient();
    if (!supabase) return [];

    const statuses: EventStatus[] = includeArchived
      ? ['published', 'ongoing', 'wrap_up', 'closed', 'archived', 'cancelled']
      : ['published', 'ongoing', 'wrap_up', 'closed', 'cancelled'];

    const { data } = await supabase
      .from('events')
      .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity')
      .eq('audience', 'public')
      .in('status', statuses)
      .order('starts_at', { ascending: false, nullsFirst: false });

    return (data as PublicEvent[]) ?? [];
  },
  ['public-events'],
  { revalidate: 60, tags: ['public-events'] }
);

export const getPublicEventBySlug = unstable_cache(
  async (slug: string): Promise<{
    event: PublicEvent | null;
    guests: PublicEventGuest[];
    highlights: PublicEventHighlight[];
    manuals: PublicEventManual[];
  }> => {
    const supabase = createPublicClient();
    if (!supabase) return { event: null, guests: [], highlights: [], manuals: [] };

    const { data: event } = await supabase
      .from('events')
      .select('id, slug, title, summary, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, status, is_paid, fee_amount, poster_ref, max_capacity')
      .eq('slug', slug)
      .eq('audience', 'public')
      .in('status', ['published', 'ongoing', 'wrap_up', 'closed', 'archived', 'cancelled'])
      .maybeSingle();

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
  },
  ['public-event-by-slug'],
  { revalidate: 60, tags: ['public-events'] }
);
