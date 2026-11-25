-- =============================================================================
-- Migration 007: Phase 2 — Team Workspace, Operational Teams & Tasks
-- Project: E-Cell AITR
-- Apply after: 006_phase1_events_and_public.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. ENUMS & CONFIRMED 12 OPERATIONAL TEAMS
-- -------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum (
      'todo',
      'in_progress',
      'submitted',
      'approved',
      'changes_requested'
    );
  end if;
end $$;

create table if not exists public.operational_teams (
  code          text    primary key,
  name          text    not null,
  description   text    not null default '',
  display_order integer not null default 0
);

insert into public.operational_teams (code, name, description, display_order) values
  ('RD',        'Registration & Check-in',      'Registrations, participant counts, ticket QR check-in, and attendance sync.', 1),
  ('AV',        'Audio & Visual',               'Equipment, sound checks, presentations, videos, and screen graphics.',         2),
  ('STAGE',     'Stage Management',             'Running order, speaker readiness, stage setup, and session handovers.',        3),
  ('LOGISTICS', 'Logistics',                    'Materials, quantities, pickup/setup/return, and venue readiness.',             4),
  ('CROWD',     'Crowd & Venue Management',     'Entrance, seating areas, queues, and venue flow.',                             5),
  ('CLIX',      'Photography (Clix)',           'Shot lists, session coverage, shortlisted event photos.',                      6),
  ('GUEST',     'Guest Relations',              'Guest reception, arrival/departure tracking, and hospitality.',                7),
  ('DOCS',      'Documentation & Reports',      'Session notes, statistics, report drafting and review.',                       8),
  ('ANCHORING', 'Anchoring',                    'Session anchors, opening/closing/transition scripts, rehearsals.',             9),
  ('DESIGN',    'Design & Creatives',           'Structured design briefs, podium graphics, backdrops, asset approvals.',      10),
  ('VIDEO',     'Video Production / Editing',   'Recording/editing briefs, draft cuts, reels, and captions.',                  11),
  ('SOCIAL',    'Social Media & Publicity',     'Pre/live/post-event content plans, caption drafts, published links.',         12)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    display_order = excluded.display_order;

-- -------------------------------------------------------------------------
-- 2. EVENT TEAM MEMBERS & TASKS
-- -------------------------------------------------------------------------

create table if not exists public.event_team_members (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references public.events(id) on delete cascade,
  user_id        uuid        not null references public.profiles(id) on delete cascade,
  team_code      text        not null references public.operational_teams(code),
  is_coordinator boolean     not null default false,
  assigned_by    uuid        references public.profiles(id),
  created_at     timestamptz not null default now(),

  constraint event_team_members_unique unique (event_id, user_id, team_code)
);

create table if not exists public.tasks (
  id               uuid               primary key default gen_random_uuid(),
  event_id         uuid               not null references public.events(id) on delete cascade,
  team_code        text               not null references public.operational_teams(code),
  title            text               not null,
  brief            text               not null default '',
  deliverable_spec text,
  assignee_id      uuid               references public.profiles(id),
  status           public.task_status not null default 'todo',
  blocker_note     text,
  submission_url   text,
  due_at           timestamptz,
  created_by       uuid               not null references public.profiles(id),
  created_at       timestamptz        not null default now(),
  updated_at       timestamptz        not null default now(),

  constraint tasks_submission_url_format check (
    submission_url is null or submission_url ~* '^https?://'
  )
);

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create table if not exists public.task_comments (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null references public.tasks(id) on delete cascade,
  author_id  uuid        not null references public.profiles(id) on delete cascade,
  body       text        not null,
  created_at timestamptz not null default now(),

  constraint task_comments_nonempty check (length(trim(body)) > 0)
);

-- -------------------------------------------------------------------------
-- 3. WORKSPACE PERMISSION HELPERS & TASK UPDATE GUARD
-- -------------------------------------------------------------------------

create or replace function public.is_event_team_member(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_team_members m
    where m.event_id = p_event_id
      and m.user_id = p_user_id
  )
  and public.is_core_team_or_above(p_user_id);
$$;

create or replace function public.can_access_event_workspace(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_event(p_event_id, p_user_id)
      or public.is_event_team_member(p_event_id, p_user_id);
$$;

-- Guard: non-SPOC team members can only update status (not to 'approved'),
-- blocker_note, and submission_url on their own/team tasks.
create or replace function public.guard_task_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;

  if public.can_manage_event(old.event_id, v_uid) then
    return new;
  end if;

  if new.title is distinct from old.title
     or new.brief is distinct from old.brief
     or new.deliverable_spec is distinct from old.deliverable_spec
     or new.team_code is distinct from old.team_code
     or new.assignee_id is distinct from old.assignee_id
     or new.due_at is distinct from old.due_at then
    raise exception 'Only Event Leads (SPOCs) or Advisors can modify task structure or assignments.';
  end if;

  if new.status = 'approved' and old.status <> 'approved' then
    raise exception 'Only Event Leads (SPOCs) or Advisors can approve tasks.';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_guard_updates on public.tasks;
create trigger tasks_guard_updates
  before update on public.tasks
  for each row execute procedure public.guard_task_updates();

-- -------------------------------------------------------------------------
-- 4. RLS POLICIES
-- -------------------------------------------------------------------------

alter table public.operational_teams  enable row level security;
alter table public.event_team_members enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_comments      enable row level security;

-- Update events_workspace_read so assigned Event Team members can see their assigned events
drop policy if exists "events_workspace_read" on public.events;
create policy "events_workspace_read"
  on public.events for select
  to authenticated
  using (public.can_access_event_workspace(id, auth.uid()) or created_by = auth.uid());

-- OPERATIONAL_TEAMS
drop policy if exists "operational_teams_core_read" on public.operational_teams;
create policy "operational_teams_core_read"
  on public.operational_teams for select
  to authenticated
  using (public.is_core_team_or_above(auth.uid()));

-- EVENT_TEAM_MEMBERS
drop policy if exists "event_team_members_workspace_read" on public.event_team_members;
create policy "event_team_members_workspace_read"
  on public.event_team_members for select
  to authenticated
  using (public.can_access_event_workspace(event_id, auth.uid()));

drop policy if exists "event_team_members_manage_write" on public.event_team_members;
create policy "event_team_members_manage_write"
  on public.event_team_members for all
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()))
  with check (
    public.can_manage_event(event_id, auth.uid())
    and public.is_core_team_or_above(user_id)
  );

-- TASKS
drop policy if exists "tasks_workspace_read" on public.tasks;
create policy "tasks_workspace_read"
  on public.tasks for select
  to authenticated
  using (public.can_access_event_workspace(event_id, auth.uid()));

drop policy if exists "tasks_manage_insert" on public.tasks;
create policy "tasks_manage_insert"
  on public.tasks for insert
  to authenticated
  with check (
    public.can_manage_event(event_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "tasks_manage_delete" on public.tasks;
create policy "tasks_manage_delete"
  on public.tasks for delete
  to authenticated
  using (public.can_manage_event(event_id, auth.uid()));

drop policy if exists "tasks_member_or_spoc_update" on public.tasks;
create policy "tasks_member_or_spoc_update"
  on public.tasks for update
  to authenticated
  using (
    public.can_manage_event(event_id, auth.uid())
    or assignee_id = auth.uid()
    or exists (
      select 1 from public.event_team_members m
      where m.event_id = tasks.event_id
        and m.user_id = auth.uid()
        and m.team_code = tasks.team_code
    )
  )
  with check (
    public.can_access_event_workspace(event_id, auth.uid())
  );

-- TASK_COMMENTS
drop policy if exists "task_comments_workspace_read" on public.task_comments;
create policy "task_comments_workspace_read"
  on public.task_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and public.can_access_event_workspace(t.event_id, auth.uid())
    )
  );

drop policy if exists "task_comments_workspace_insert" on public.task_comments;
create policy "task_comments_workspace_insert"
  on public.task_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and public.can_access_event_workspace(t.event_id, auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- 5. INDEXES
-- -------------------------------------------------------------------------

create index if not exists idx_event_team_members_user on public.event_team_members (user_id, event_id);
create index if not exists idx_tasks_event_team on public.tasks (event_id, team_code, status);
create index if not exists idx_tasks_assignee on public.tasks (assignee_id, status);
create index if not exists idx_task_comments_task on public.task_comments (task_id, created_at);
