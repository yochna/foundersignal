-- =============================================================================
-- user_activity: lightweight event log for the admin panel.
--
-- Every page view (and, over time, any explicit event a route chooses to
-- record) lands one row here. This is deliberately separate from
-- Vercel's own Web Analytics: that gives aggregate traffic numbers, this
-- gives an attributable, queryable trail of what a specific signed-in user
-- did, which is what the admin panel needs to answer "who did what".
--
-- Run this once in the Supabase SQL editor (or via `npm run db:push`).
-- Safe to re-run.
-- =============================================================================

create table if not exists public.user_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.users (id) on delete set null,
  session_id  text,
  event       text not null,
  path        text,
  meta_json   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists user_activity_created_idx on public.user_activity (created_at desc);
create index if not exists user_activity_user_idx    on public.user_activity (user_id, created_at desc);

alter table public.user_activity enable row level security;

-- No anon policy is defined on purpose: this table is written and read only
-- by the server via the service-role key (see lib/db/supabase.js), the same
-- access model as api_usage and idea_validations.

-- Housekeeping: keep the table from growing without bound on a long-lived
-- deployment. This does not run automatically; call it from a periodic job
-- (e.g. the existing daily ingestion cron) if you want rotation.
create or replace function public.prune_user_activity(retain_days integer default 90)
returns void
language sql
as $$
  delete from public.user_activity
  where created_at < now() - (retain_days || ' days')::interval;
$$;
