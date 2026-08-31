-- =============================================================================
-- FounderSignal schema
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / DROP-CREATE.
--
-- Access model
--   The Next.js server talks to Postgres with the service-role key, which
--   bypasses RLS. The policies below exist so that the anon key (the only key a
--   browser could ever hold) can read public opportunity data and nothing else.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- users: mirrored from the NextAuth session on each sign-in.
-- The id is the provider-derived subject, not a Supabase auth user, so it is
-- text rather than uuid.
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id            text primary key,
  email         text,
  name          text,
  image         text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (lower(email));

-- -----------------------------------------------------------------------------
-- opportunities: the product's core content, written by ingestion runs.
-- Nested structures stay as jsonb because they are always read as a whole
-- document by the detail page and never filtered on individually.
-- -----------------------------------------------------------------------------
create table if not exists public.opportunities (
  id                          text primary key,
  cluster_id                  text,
  title                       text not null,
  problem                     text default '',
  target_customer             text default '',
  industry                    text default '',
  vertical                    text default 'IT',
  score                       integer not null default 0 check (score between 0 and 100),
  scores_json                 jsonb  not null default '{}'::jsonb,
  momentum                    text   not null default 'steady'
                                check (momentum in ('rising', 'steady', 'declining')),
  change_percentage           integer not null default 0,
  signal_count                integer not null default 0,
  source_count                integer not null default 0,
  why_interesting             text default '',
  overview                    text default '',
  why_matters                 text default '',
  demand_analysis             text default '',
  signals_timeline_json       jsonb not null default '[]'::jsonb,
  hiring_signals_json         jsonb not null default '[]'::jsonb,
  skill_signals_json          jsonb not null default '[]'::jsonb,
  regulatory_signals_json     jsonb not null default '[]'::jsonb,
  technology_signals_json     jsonb not null default '[]'::jsonb,
  competition_list_json       jsonb not null default '[]'::jsonb,
  market_gap                  text default '',
  mvp_recommendation          text default '',
  monetization_hypothesis     text default '',
  risks_json                  jsonb not null default '[]'::jsonb,
  india_relevance_text        text default '',
  related_opportunities_json  jsonb not null default '[]'::jsonb,
  feeds_json                  jsonb not null default '{"reddit":[],"github":[],"linkedin":[]}'::jsonb,
  last_updated                text default '',
  source                      text not null default 'ingested',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists opportunities_score_idx     on public.opportunities (score desc);
create index if not exists opportunities_vertical_idx  on public.opportunities (vertical);
create index if not exists opportunities_momentum_idx  on public.opportunities (momentum);
create index if not exists opportunities_cluster_idx   on public.opportunities (cluster_id);

-- Free-text search across the fields the Radar search box covers.
create index if not exists opportunities_search_idx on public.opportunities
  using gin (to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(problem, '') || ' ' ||
    coalesce(industry, '') || ' ' ||
    coalesce(why_interesting, '')));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunities_touch_updated_at on public.opportunities;
create trigger opportunities_touch_updated_at
  before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- raw_signals: the collected evidence behind each ingestion run.
-- -----------------------------------------------------------------------------
create table if not exists public.raw_signals (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  text          text not null,
  url           text,
  cluster_id    text,
  published_at  text,
  ingested_at   timestamptz not null default now()
);

create index if not exists raw_signals_cluster_idx  on public.raw_signals (cluster_id);
create index if not exists raw_signals_ingested_idx on public.raw_signals (ingested_at desc);

-- -----------------------------------------------------------------------------
-- saved_opportunities: per-user watchlist.
-- -----------------------------------------------------------------------------
create table if not exists public.saved_opportunities (
  user_id         text not null references public.users (id) on delete cascade,
  opportunity_id  text not null references public.opportunities (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create index if not exists saved_opportunities_user_idx on public.saved_opportunities (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- quiz_results: Builder Match submissions and the ranked output.
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_results (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users (id) on delete cascade,
  answers_json  jsonb not null default '{}'::jsonb,
  results_json  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists quiz_results_user_idx on public.quiz_results (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- resume_profiles: Career Signal parses. Stores extracted structure only,
-- never the original file bytes.
-- -----------------------------------------------------------------------------
create table if not exists public.resume_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users (id) on delete cascade,
  file_name     text,
  parsed_json   jsonb not null default '{}'::jsonb,
  demand_score  integer not null default 0 check (demand_score between 0 and 100),
  created_at    timestamptz not null default now()
);

create index if not exists resume_profiles_user_idx on public.resume_profiles (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- idea_validations: Idea Validator history.
-- -----------------------------------------------------------------------------
create table if not exists public.idea_validations (
  id                uuid primary key default gen_random_uuid(),
  user_id           text references public.users (id) on delete cascade,
  idea_text         text not null,
  result_json       jsonb not null default '{}'::jsonb,
  validation_score  integer not null default 0 check (validation_score between 0 and 100),
  created_at        timestamptz not null default now()
);

create index if not exists idea_validations_user_idx on public.idea_validations (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- ingestion_runs: one row per pipeline execution. This table is the evidence
-- for the "update the feed" requirement.
-- -----------------------------------------------------------------------------
create table if not exists public.ingestion_runs (
  id                   uuid primary key default gen_random_uuid(),
  status               text not null default 'running'
                         check (status in ('running', 'success', 'partial', 'failed')),
  signals_count        integer not null default 0,
  opportunities_count  integer not null default 0,
  sources_json         jsonb not null default '[]'::jsonb,
  error                text,
  started_at           timestamptz not null default now(),
  finished_at          timestamptz
);

create index if not exists ingestion_runs_started_idx on public.ingestion_runs (started_at desc);

-- -----------------------------------------------------------------------------
-- api_usage: every AI attempt, including refusals. Powers quota enforcement and
-- the real cost figures on the admin dashboard.
-- -----------------------------------------------------------------------------
create table if not exists public.api_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        text references public.users (id) on delete set null,
  feature        text not null,
  provider       text not null default 'gemini',
  outcome        text not null default 'live'
                   check (outcome in ('live', 'cached', 'fallback', 'blocked', 'error')),
  tokens_used    integer not null default 0,
  cost_estimate  numeric(12, 6) not null default 0,
  latency_ms     integer not null default 0,
  day_key        date not null default (now() at time zone 'utc')::date,
  created_at     timestamptz not null default now()
);

create index if not exists api_usage_quota_idx   on public.api_usage (day_key, feature, user_id, outcome);
create index if not exists api_usage_user_idx    on public.api_usage (user_id, created_at desc);
create index if not exists api_usage_created_idx on public.api_usage (created_at desc);

-- -----------------------------------------------------------------------------
-- chat_messages: AI Copilot transcript per user.
-- -----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);

-- -----------------------------------------------------------------------------
-- ai_cache: deduplicates identical AI requests inside the TTL window so the
-- free Gemini quota is not spent twice on the same question.
-- -----------------------------------------------------------------------------
create table if not exists public.ai_cache (
  key         text primary key,
  value_json  jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists ai_cache_expires_idx on public.ai_cache (expires_at);

-- =============================================================================
-- Row Level Security
--
-- Enabled on every table. The service-role key used by the server bypasses
-- these entirely; they constrain the anon/authenticated keys.
-- =============================================================================

alter table public.users               enable row level security;
alter table public.opportunities       enable row level security;
alter table public.raw_signals         enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.quiz_results        enable row level security;
alter table public.resume_profiles     enable row level security;
alter table public.idea_validations    enable row level security;
alter table public.ingestion_runs      enable row level security;
alter table public.api_usage           enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.ai_cache            enable row level security;

-- Opportunities are public reference content: anyone may read, nobody may write
-- without the service role.
drop policy if exists opportunities_public_read on public.opportunities;
create policy opportunities_public_read
  on public.opportunities for select
  using (true);

-- Ingestion history is readable so a reviewer can verify a run happened.
drop policy if exists ingestion_runs_public_read on public.ingestion_runs;
create policy ingestion_runs_public_read
  on public.ingestion_runs for select
  using (true);

-- Owner-scoped tables. auth.uid() is compared as text because our user ids come
-- from NextAuth rather than Supabase auth.
drop policy if exists saved_owner_all on public.saved_opportunities;
create policy saved_owner_all
  on public.saved_opportunities for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists quiz_owner_all on public.quiz_results;
create policy quiz_owner_all
  on public.quiz_results for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists resume_owner_all on public.resume_profiles;
create policy resume_owner_all
  on public.resume_profiles for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists validations_owner_all on public.idea_validations;
create policy validations_owner_all
  on public.idea_validations for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists chat_owner_all on public.chat_messages;
create policy chat_owner_all
  on public.chat_messages for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists users_self_read on public.users;
create policy users_self_read
  on public.users for select
  using (id = auth.uid()::text);

-- raw_signals, api_usage and ai_cache intentionally receive no policies:
-- with RLS enabled and no policy, only the service role can touch them.

-- =============================================================================
-- Verification query. Should return 11 rows.
-- =============================================================================
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
