-- Performance indexes for hot queries across events, memberships, registrations, tasks, and alumni connect
-- Safe idempotent creation

CREATE INDEX IF NOT EXISTS idx_events_public_status_starts
  ON public.events (audience, status, starts_at DESC)
  WHERE audience = 'public';

CREATE INDEX IF NOT EXISTS idx_events_slug
  ON public.events (slug);

CREATE INDEX IF NOT EXISTS idx_org_memberships_active_role
  ON public.org_memberships (status, role, user_id)
  WHERE effective_until IS NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_event_user
  ON public.registrations (event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_registrations_user_created
  ON public.registrations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event_team_status
  ON public.event_tasks (event_id, team_code, status);

CREATE INDEX IF NOT EXISTS idx_alumni_messages_conv_created
  ON public.alumni_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_opportunities_active_created
  ON public.opportunities (status, created_at DESC)
  WHERE status = 'active';
