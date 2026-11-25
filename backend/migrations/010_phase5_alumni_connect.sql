-- =============================================================================
-- Migration 010: Phase 5 — Alumni Connect (Private EDC AITR Network)
-- Project: EDC AITR (Entrepreneurship Development Cell, AITR)
-- Apply after: 009_phase4_certificates_closure_highlights_manuals.sql
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. ALUMNI PROFILES & PRIVACY CONTROLS
-- -------------------------------------------------------------------------

create table if not exists public.alumni_profiles (
  user_id             uuid        primary key references public.profiles(id) on delete cascade,
  batch_year          integer,
  city                text,
  industry            text,
  domain              text,
  startup_stage       text,
  labels              text[]      not null default '{}'::text[], -- optional: Founder, Investor, Mentor
  show_in_directory   boolean     not null default true,
  show_contact        boolean     not null default false,
  allow_messages      boolean     not null default true,
  digest_opt_in       boolean     not null default false,
  updated_at          timestamptz not null default now()
);

drop trigger if exists alumni_profiles_updated_at on public.alumni_profiles;
create trigger alumni_profiles_updated_at
  before update on public.alumni_profiles
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 2. STARTUP SHOWCASE & OPPORTUNITY BOARD
-- -------------------------------------------------------------------------

create table if not exists public.startups (
  id             uuid        primary key default gen_random_uuid(),
  owner_id       uuid        not null references public.profiles(id) on delete cascade,
  name           text        not null,
  description    text        not null,
  stage          text        not null default 'idea',
  team_summary   text,
  website_url    text,
  pitch_deck_url text,
  status         text        not null default 'submitted',
  moderator_note text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint startups_status_valid check (
    status in ('draft', 'submitted', 'published', 'changes_requested', 'archived')
  )
);

drop trigger if exists startups_updated_at on public.startups;
create trigger startups_updated_at
  before update on public.startups
  for each row execute procedure public.set_updated_at();

create table if not exists public.opportunities (
  id                 uuid        primary key default gen_random_uuid(),
  author_id          uuid        not null references public.profiles(id) on delete cascade,
  startup_name       text,
  listing_type       text        not null,
  title              text        not null,
  description        text        not null,
  skills             text,
  location           text,
  compensation       text,
  application_method text        not null,
  deadline           date,
  status             text        not null default 'open',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint opportunities_type_valid check (listing_type in ('internship', 'full_time', 'cofounder')),
  constraint opportunities_status_valid check (status in ('draft', 'open', 'closed', 'archived'))
);

drop trigger if exists opportunities_updated_at on public.opportunities;
create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 3. DIRECT MESSAGING, CONTACT REQUESTS & ANTI-SPAM CONTROLS
-- -------------------------------------------------------------------------

create table if not exists public.conversations (
  id             uuid        primary key default gen_random_uuid(),
  initiator_id   uuid        not null references public.profiles(id) on delete cascade,
  recipient_id   uuid        not null references public.profiles(id) on delete cascade,
  request_status text        not null default 'pending',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint conversations_no_self check (initiator_id <> recipient_id),
  constraint conversations_unique_pair unique (initiator_id, recipient_id),
  constraint conversations_status_valid check (request_status in ('pending', 'accepted', 'declined'))
);

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references public.profiles(id) on delete cascade,
  body            text        not null,
  created_at      timestamptz not null default now(),

  constraint messages_nonempty check (length(trim(body)) > 0 and length(body) <= 2000)
);

create table if not exists public.user_blocks (
  blocker_id uuid        not null references public.profiles(id) on delete cascade,
  blocked_id uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create table if not exists public.message_reports (
  id              uuid        primary key default gen_random_uuid(),
  reporter_id     uuid        not null references public.profiles(id) on delete cascade,
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  reason          text        not null,
  created_at      timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 4. RLS POLICIES (STRICTLY GATED TO ALUMNI CONNECT ELIGIBLE MEMBERS)
-- -------------------------------------------------------------------------

alter table public.alumni_profiles enable row level security;
alter table public.startups        enable row level security;
alter table public.opportunities   enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;
alter table public.user_blocks     enable row level security;
alter table public.message_reports enable row level security;

-- ALUMNI_PROFILES
drop policy if exists "alumni_profiles_eligible_read" on public.alumni_profiles;
create policy "alumni_profiles_eligible_read"
  on public.alumni_profiles for select
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (show_in_directory = true or user_id = auth.uid())
  );

drop policy if exists "alumni_profiles_own_write" on public.alumni_profiles;
create policy "alumni_profiles_own_write"
  on public.alumni_profiles for all
  to authenticated
  using (user_id = auth.uid() and public.is_alumni_connect_eligible(auth.uid()))
  with check (user_id = auth.uid() and public.is_alumni_connect_eligible(auth.uid()));

-- STARTUPS
drop policy if exists "startups_eligible_read" on public.startups;
create policy "startups_eligible_read"
  on public.startups for select
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (
      status = 'published'
      or owner_id = auth.uid()
      or public.is_advisor_or_above(auth.uid())
    )
  );

drop policy if exists "startups_owner_insert" on public.startups;
create policy "startups_owner_insert"
  on public.startups for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and public.is_alumni_connect_eligible(auth.uid())
  );

drop policy if exists "startups_owner_or_mod_update" on public.startups;
create policy "startups_owner_or_mod_update"
  on public.startups for update
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (owner_id = auth.uid() or public.is_advisor_or_above(auth.uid()))
  )
  with check (
    public.is_alumni_connect_eligible(auth.uid())
    and (owner_id = auth.uid() or public.is_advisor_or_above(auth.uid()))
  );

-- OPPORTUNITIES
drop policy if exists "opportunities_eligible_read" on public.opportunities;
create policy "opportunities_eligible_read"
  on public.opportunities for select
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (
      status = 'open'
      or author_id = auth.uid()
      or public.is_advisor_or_above(auth.uid())
    )
  );

drop policy if exists "opportunities_author_insert" on public.opportunities;
create policy "opportunities_author_insert"
  on public.opportunities for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_alumni_connect_eligible(auth.uid())
  );

drop policy if exists "opportunities_author_or_mod_update" on public.opportunities;
create policy "opportunities_author_or_mod_update"
  on public.opportunities for update
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (author_id = auth.uid() or public.is_advisor_or_above(auth.uid()))
  )
  with check (
    public.is_alumni_connect_eligible(auth.uid())
    and (author_id = auth.uid() or public.is_advisor_or_above(auth.uid()))
  );

-- CONVERSATIONS (strictly participant-only; Director has NO arbitrary read access)
drop policy if exists "conversations_participant_read" on public.conversations;
create policy "conversations_participant_read"
  on public.conversations for select
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and (initiator_id = auth.uid() or recipient_id = auth.uid())
  );

-- MESSAGES (strictly participant-only; Director has NO arbitrary read access)
drop policy if exists "messages_participant_read" on public.messages;
create policy "messages_participant_read"
  on public.messages for select
  to authenticated
  using (
    public.is_alumni_connect_eligible(auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.initiator_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

-- USER_BLOCKS
drop policy if exists "user_blocks_own" on public.user_blocks;
create policy "user_blocks_own"
  on public.user_blocks for all
  to authenticated
  using (blocker_id = auth.uid() and public.is_alumni_connect_eligible(auth.uid()))
  with check (blocker_id = auth.uid() and public.is_alumni_connect_eligible(auth.uid()));

-- MESSAGE_REPORTS
drop policy if exists "message_reports_insert" on public.message_reports;
create policy "message_reports_insert"
  on public.message_reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and public.is_alumni_connect_eligible(auth.uid()));

drop policy if exists "message_reports_mod_read" on public.message_reports;
create policy "message_reports_mod_read"
  on public.message_reports for select
  to authenticated
  using (public.is_advisor_or_above(auth.uid()));

-- -------------------------------------------------------------------------
-- 5. INDEXES
-- -------------------------------------------------------------------------

create index if not exists idx_alumni_profiles_filters on public.alumni_profiles (show_in_directory, batch_year, industry, city);
create index if not exists idx_startups_status on public.startups (status, created_at desc);
create index if not exists idx_opportunities_status on public.opportunities (status, listing_type, created_at desc);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at asc);
