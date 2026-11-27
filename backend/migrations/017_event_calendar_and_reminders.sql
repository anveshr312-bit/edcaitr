-- =============================================================================
-- Migration 017: Event Calendar Planning, Progress Tracking & Reminders
-- Project: E-Cell AITR
-- =============================================================================

-- 1. Add planning progress, stage, and cancellation metadata to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS planning_progress INTEGER DEFAULT 0 CHECK (planning_progress >= 0 AND planning_progress <= 100);

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS planning_stage VARCHAR(50) DEFAULT 'concept';

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 2. Create Event Reminders table for public delegate bookmarks and cancellation updates
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_reminders_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_user_event ON public.event_reminders(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON public.event_reminders(event_id);

-- Enable RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_user_all" ON public.event_reminders;
CREATE POLICY "reminders_user_all" ON public.event_reminders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reminders_workspace_read" ON public.event_reminders;
CREATE POLICY "reminders_workspace_read" ON public.event_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('core_team', 'advisor', 'director')
        AND m.status = 'approved'
    )
  );

COMMENT ON COLUMN public.events.planning_progress IS 'Progress percentage (0-100) of event readiness';
COMMENT ON COLUMN public.events.planning_stage IS 'Planning stage: concept, speakers_curation, permissions_venue, marketing_ready, live_ready, concluded, cancelled';
COMMENT ON COLUMN public.events.cancellation_reason IS 'Official public notice explaining why an event was cancelled or rescheduled';
