-- =============================================================================
-- FounderSignal: onboarding answers stored on user_profiles
--
-- Run after 002_profiles_community_roadmaps.sql. Safe to re-run.
--
-- Onboarding captures fields (role, city, capital, regulatory,
-- onboardingComplete) that have no dedicated columns. Rather than widening the
-- table for a one-shot form, the whole answer set is stored as one JSON blob;
-- the driver lifts it so callers keep seeing flat fields.
-- =============================================================================

alter table public.user_profiles
  add column if not exists onboarding_json jsonb not null default '{}'::jsonb;
