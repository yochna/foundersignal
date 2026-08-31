-- =============================================================================
-- FounderSignal: real billing (Razorpay)
--
-- Run after 003_onboarding.sql. Safe to re-run.
--
-- Adds a durable plan to `users` (so entitlement survives cleared cookies and
-- different devices) and a `payments` table as an audit trail of every order
-- Razorpay ever told us about, verified or not.
-- =============================================================================

alter table public.users
  add column if not exists plan             text not null default 'free',
  add column if not exists plan_expires_at  timestamptz;

create table if not exists public.payments (
  id                 text primary key,        -- Razorpay order id
  user_id            text references public.users(id),
  plan               text not null,
  amount_paise       integer not null,
  currency           text not null default 'INR',
  status             text not null default 'created', -- created | captured | failed
  razorpay_payment_id text,
  created_at         timestamptz not null default now(),
  captured_at        timestamptz
);

create index if not exists payments_user_idx on public.payments (user_id);

alter table public.payments enable row level security;
-- No anon policies: only the server (service-role key) ever touches this table.
