import { getPublicEvents } from '../../../lib/events/events';
import { createClient } from '../../../lib/supabase/server';
import { getUserContext } from '../../../lib/auth/authorization';

export async function GET(request: Request) {
  const events = await getPublicEvents(true);
  const results = events.map(event => ({ title: event.title, subtitle: 'Public event', href: '/events/' + event.slug, terms: 'calendar' }));
  const ctx = await getUserContext();
  const eventId = new URL(request.url).searchParams.get('event');
  if (ctx && eventId && /^[0-9a-f-]{36}$/i.test(eventId) && ['advisor','director','core_team'].includes(ctx.role)) {
    const session = await createClient();
    const { data } = await session!.from('tasks').select('id,title,team_code').eq('event_id', eventId).order('title').limit(100);
    for (const task of data ?? []) results.push({ title: task.title, subtitle: task.team_code + ' task', href: '/workspace/events/' + eventId + '/tasks#task-' + task.id, terms: 'workspace' });
  }
  return Response.json({results,userId: ctx?.id ?? null}, {headers: {'Cache-Control':'private, no-store'}});
}
