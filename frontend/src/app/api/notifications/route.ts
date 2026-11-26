import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'system' | 'recruitment' | 'task' | 'message' | 'event';
  href: string;
  timestamp: string;
  unread: boolean;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch latest cell-wide announcements (publicly accessible)
  const { data: rawAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, event_id')
    .order('created_at', { ascending: false })
    .limit(8);

  const announcements = (rawAnnouncements ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.created_at,
    eventId: a.event_id,
  }));

  // If not logged in, return cell announcements only
  if (!user) {
    return NextResponse.json({
      role: 'guest',
      announcements,
      notifications: [],
    });
  }

  const role = await getUserRole(user.id);
  const notifications: NotificationItem[] = [];

  try {
    // 2. Role-specific personalized notifications
    if (role === 'director' || role === 'advisor') {
      const { data: pendingApps } = await supabase
        .from('applications')
        .select('id, desired_role, created_at, profiles!user_id(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pendingApps && pendingApps.length > 0) {
        pendingApps.forEach((app) => {
          const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
          const candidateName = profile?.full_name ?? 'Candidate';
          notifications.push({
            id: `app-${app.id}`,
            title: 'Recruitment Review Pending',
            description: `${candidateName} submitted an application for ${app.desired_role.replace('_', ' ')}.`,
            category: 'recruitment',
            href: '/account/applications',
            timestamp: app.created_at,
            unread: true,
          });
        });
      }
    }

    if (role === 'core_team' || role === 'director') {
      // Check tasks assigned to user
      const { data: assignedTasks } = await supabase
        .from('event_tasks')
        .select('id, title, status, event_id, events!event_id(title)')
        .eq('assignee_id', user.id)
        .neq('status', 'done')
        .limit(5);

      if (assignedTasks && assignedTasks.length > 0) {
        assignedTasks.forEach((t) => {
          const ev = Array.isArray(t.events) ? t.events[0] : t.events;
          notifications.push({
            id: `task-${t.id}`,
            title: 'Assigned Event Task',
            description: `Task "${t.title}" for ${ev?.title ?? 'Event'} requires your action.`,
            category: 'task',
            href: `/workspace/events/${t.event_id}/tasks`,
            timestamp: new Date().toISOString(),
            unread: t.status === 'todo',
          });
        });
      }
    }

    if (role === 'alumni' || role === 'director') {
      // Check for messages
      const { data: recentMsgs } = await supabase
        .from('alumni_messages')
        .select('id, created_at, body, sender_id, profiles!sender_id(full_name)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentMsgs && recentMsgs.length > 0) {
        recentMsgs.forEach((m) => {
          const snd = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          notifications.push({
            id: `msg-${m.id}`,
            title: 'New Alumni Network Message',
            description: `${snd?.full_name ?? 'A member'} sent you a message: "${m.body.slice(0, 40)}…"`,
            category: 'message',
            href: '/alumni/messages',
            timestamp: m.created_at,
            unread: true,
          });
        });
      }
    }

    // Participant notifications (registered upcoming passes)
    const { data: regEvents } = await supabase
      .from('registrations')
      .select('id, status, created_at, events!event_id(id, title, starts_at)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(3);

    if (regEvents && regEvents.length > 0) {
      regEvents.forEach((r) => {
        const ev = Array.isArray(r.events) ? r.events[0] : r.events;
        if (ev) {
          notifications.push({
            id: `reg-${r.id}`,
            title: 'Event Pass Confirmed',
            description: `Your gate ticket for ${ev.title} is active.`,
            category: 'event',
            href: `/portal/registrations/${r.id}`,
            timestamp: r.created_at,
            unread: false,
          });
        }
      });
    }
  } catch {
    // Non-fatal fallback for table existence
  }

  return NextResponse.json({
    role,
    announcements,
    notifications,
  });
}
