-- =============================================================================
-- FounderSignal: profiles, community forum and saved roadmaps
--
-- Run after 001_schema.sql. Safe to re-run: every statement is guarded with
-- IF NOT EXISTS / DROP-CREATE, matching the first migration.
--
-- Vote and comment totals are deliberately NOT denormalised onto the parent
-- row. At this scale one extra query per listing aggregates them exactly, and
-- a counter that can drift is worse than a join that cannot.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_profiles: everything the user can edit about themselves. Kept separate
-- from public.users because that table mirrors the identity provider and is
-- overwritten on every sign-in.
-- -----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id           text primary key references public.users (id) on delete cascade,
  display_name      text default '',
  headline          text default '',
  bio               text default '',
  location          text default '',
  -- Not "current_role": that is a reserved SQL keyword and would need quoting
  -- in every statement that touches it.
  role_title        text default '',
  company           text default '',
  experience_years  integer not null default 0 check (experience_years between 0 and 60),
  builder_stage     text not null default 'exploring'
                      check (builder_stage in ('exploring', 'validating', 'building', 'launched', 'scaling')),
  weekly_hours      integer not null default 0 check (weekly_hours between 0 and 120),
  skills_json       jsonb not null default '[]'::jsonb,
  interests_json    jsonb not null default '[]'::jsonb,
  verticals_json    jsonb not null default '[]'::jsonb,
  looking_for       text default '',
  website_url       text default '',
  github_url        text default '',
  linkedin_url      text default '',
  twitter_url       text default '',
  visibility        text not null default 'public' check (visibility in ('public', 'private')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- community_posts: top-level threads.
-- -----------------------------------------------------------------------------
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users (id) on delete cascade,
  title         text not null,
  body          text not null default '',
  topic         text not null default 'general',
  tags_json     jsonb not null default '[]'::jsonb,
  link_url      text default '',
  opportunity_id text references public.opportunities (id) on delete set null,
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_posts_topic_idx   on public.community_posts (topic, created_at desc);
create index if not exists community_posts_user_idx    on public.community_posts (user_id, created_at desc);
create index if not exists community_posts_search_idx  on public.community_posts
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')));

drop trigger if exists community_posts_touch_updated_at on public.community_posts;
create trigger community_posts_touch_updated_at
  before update on public.community_posts
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- community_comments: replies, self-referencing for one level of threading.
-- -----------------------------------------------------------------------------
create table if not exists public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  parent_id   uuid references public.community_comments (id) on delete cascade,
  user_id     text not null references public.users (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists community_comments_post_idx   on public.community_comments (post_id, created_at);
create index if not exists community_comments_parent_idx on public.community_comments (parent_id);
create index if not exists community_comments_user_idx   on public.community_comments (user_id, created_at desc);

drop trigger if exists community_comments_touch_updated_at on public.community_comments;
create trigger community_comments_touch_updated_at
  before update on public.community_comments
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- community_votes: one row per user per target. Changing a vote updates the
-- row, removing it deletes the row, so the tally is always derivable.
-- -----------------------------------------------------------------------------
create table if not exists public.community_votes (
  user_id      text not null references public.users (id) on delete cascade,
  target_type  text not null check (target_type in ('post', 'comment')),
  target_id    uuid not null,
  value        smallint not null check (value in (-1, 1)),
  created_at   timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists community_votes_target_idx on public.community_votes (target_type, target_id);

-- -----------------------------------------------------------------------------
-- roadmaps: generated build plans, kept so a user can revisit them.
-- -----------------------------------------------------------------------------
create table if not exists public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  user_id      text references public.users (id) on delete cascade,
  input_kind   text not null default 'idea' check (input_kind in ('role', 'idea', 'startup')),
  input_text   text not null,
  horizon      text not null default '90 days',
  title        text default '',
  result_json  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists roadmaps_user_idx on public.roadmaps (user_id, created_at desc);

-- =============================================================================
-- Row Level Security. The server uses the service-role key and bypasses all of
-- this; the policies constrain the anon key a browser could hold.
-- =============================================================================

alter table public.user_profiles      enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes    enable row level security;
alter table public.roadmaps           enable row level security;

-- The forum is readable by anyone; writing requires the service role, which
-- only the server holds, and the server checks the session first.
drop policy if exists community_posts_public_read on public.community_posts;
create policy community_posts_public_read
  on public.community_posts for select
  using (true);

drop policy if exists community_comments_public_read on public.community_comments;
create policy community_comments_public_read
  on public.community_comments for select
  using (true);

drop policy if exists community_votes_public_read on public.community_votes;
create policy community_votes_public_read
  on public.community_votes for select
  using (true);

-- A profile marked private is visible only to its owner.
drop policy if exists user_profiles_read on public.user_profiles;
create policy user_profiles_read
  on public.user_profiles for select
  using (visibility = 'public' or user_id = auth.uid()::text);

drop policy if exists user_profiles_owner_write on public.user_profiles;
create policy user_profiles_owner_write
  on public.user_profiles for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists roadmaps_owner_all on public.roadmaps;
create policy roadmaps_owner_all
  on public.roadmaps for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
