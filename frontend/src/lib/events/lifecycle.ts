interface Timing {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
}

export function eventAvailability(event: Timing, now = Date.now()) {
  const reached = (date: string | null) => date !== null && Date.parse(date) <= now;
  const lifecycle = event.status === 'archived' || event.status === 'cancelled' ? event.status
    : ['closed', 'wrap_up'].includes(event.status) || reached(event.ends_at) ? 'completed'
    : event.status === 'ongoing' || reached(event.starts_at) ? 'ongoing' : 'upcoming';
  const open = ['ongoing', 'published'].includes(event.status) && lifecycle !== 'completed'
    && (!event.registration_opens_at || reached(event.registration_opens_at))
    && !reached(event.registration_closes_at);
  return { lifecycle, open };
}
