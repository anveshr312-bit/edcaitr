import { createClient } from '../supabase/server';

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'wrap_up' | 'closed' | 'archived';

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

export async function getPublicTeamProfiles(): Promise<PublicTeamMember[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc('get_public_team_profiles');
  return (data as PublicTeamMember[]) ?? [];
}

export async function getPublicPastTeams(): Promise<PublicPastTeamMember[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc('get_public_past_teams');
  return (data as PublicPastTeamMember[]) ?? [];
}

export async function getPublicEvents(includeArchived = false): Promise<PublicEvent[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const statuses: EventStatus[] = includeArchived
    ? ['published', 'ongoing', 'wrap_up', 'closed', 'archived']
    : ['published', 'ongoing', 'wrap_up', 'closed'];

  const { data } = await supabase
    .from('events')
    .select('id, slug, title, summary, description, venue, starts_at, ends_at, status, is_paid, fee_amount, poster_ref, max_capacity')
    .eq('audience', 'public')
    .in('status', statuses)
    .order('starts_at', { ascending: false, nullsFirst: false });

  return (data as PublicEvent[]) ?? [];
}

export async function getPublicEventBySlug(slug: string): Promise<{
  event: PublicEvent | null;
  guests: PublicEventGuest[];
}> {
  const supabase = await createClient();
  if (!supabase) return { event: null, guests: [] };

  const { data: event } = await supabase
    .from('events')
    .select('id, slug, title, summary, description, venue, starts_at, ends_at, status, is_paid, fee_amount, poster_ref, max_capacity')
    .eq('slug', slug)
    .eq('audience', 'public')
    .in('status', ['published', 'ongoing', 'wrap_up', 'closed', 'archived'])
    .maybeSingle();

  if (!event) return { event: null, guests: [] };

  const { data: guests } = await supabase.rpc('get_public_event_guests', {
    p_event_id: event.id,
  });

  return {
    event: event as PublicEvent,
    guests: (guests as PublicEventGuest[]) ?? [],
  };
}
