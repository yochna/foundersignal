# FounderSignal

An opportunity radar for the Indian market. It reads hiring posts, regulatory circulars,
developer forums and open-source activity, clusters them into themes, and turns each cluster
into a scored opportunity brief with the underlying evidence attached.

Built with Next.js 14 (App Router, JavaScript only), Tailwind CSS, hand-written
shadcn-style Radix primitives, Recharts, NextAuth v4, Supabase and Gemini.

---

## 1. The problem

Most people deciding what to build start from an idea and look for validation afterwards.
The information that would have told them whether the market wants it is public but scattered:
job descriptions, RBI and SEBI circulars, Reddit complaints, GitHub issue traffic. Nobody reads
all of it, and in India the regulatory layer moves fast enough that a single circular can create
a category in a quarter.

FounderSignal inverts the order. It watches those sources continuously, groups what it finds
into themes, scores each theme on demand, timing, competition, hiring, regulation and India
relevance, and shows the raw signals behind every score so a claim can be checked rather than
trusted.

## 2. What it does

| Surface | What it answers | Where the data comes from |
| --- | --- | --- |
| **Radar** (`/radar`) | Which themes are moving right now | Ingested signals plus bundled seed briefs |
| **Opportunity detail** (`/opportunities/[id]`) | Why this theme scores what it scores | Per-brief evidence: hiring, regulatory, technology and competition signals |
| **Idea Validator** (`/idea-validator`) | Is my own idea worth building | Gemini, grounded in the brief corpus, with heuristic fallback |
| **Builder Match** (`/builder-match`) | Which of these fits my skills and appetite | 8-question quiz scored against the corpus |
| **Career Signal** (`/career-signal`) | Which skills are in demand, and what should I learn next | Resume PDF read natively by Gemini, or pasted text |
| **Suggested Roadmap** (`/roadmap`) | What do I actually do first, second, third | Phased plan for a role, idea or startup, paced to the hours you have |
| **AI Copilot** (`/chat`) | Ask anything about the corpus | Retrieval over the briefs, answers cite the briefs used |
| **Collaboration & Community** (`/community`) | What do other builders know | Threaded discussions with voting, topics and replies; readable signed out |
| **Profile** (`/profile`) | What the app knows about me, and what others see | Editable profile plus a read-only activity summary and a public view |
| **Watchlist** (`/saved`) | Themes I am tracking | Per-user rows in the data store |
| **Admin** (`/admin`) | Is the system healthy, what did it cost | Real ingestion runs, per-source health, token spend |

## 3. Core design decision: it never blanks and never crashes

Every external dependency has three tiers: **live**, **cached**, **deterministic**. A missing
API key, a spent quota, a rate limit, malformed model output and an unreachable database are
all normal, handled states rather than errors.

```
Request -> is a key configured? -> no -> deterministic result, labelled "Offline heuristic"
                                -> yes -> cache hit? -> yes -> cached result, labelled "Cached"
                                                     -> no -> under quota? -> no -> deterministic
                                                                           -> yes -> Gemini
                                                                                     |- valid JSON -> "Live AI"
                                                                                     |- broken JSON -> repair -> or deterministic
                                                                                     |- 429/5xx -> backoff -> or deterministic
```

Two rules make this honest rather than a way of hiding failure:

1. Every AI response carries `meta.source` (`live` / `cached` / `fallback`), and the UI renders
   it as a badge next to the result. Heuristic output is never presented as model output.
2. Every downgrade carries `meta.degradedReason`, written in plain language, naming both the
   cause and the remedy. The status banner and `/api/health` say the same thing.

Run the app with a completely empty `.env.local` and every page works. That is the default
demo state, and it is labelled as such throughout.

## 4. Architecture

```
app/
  (app)/                 authenticated shell: radar, opportunities, ai features, saved, admin
  api/                   route handlers, all wrapped in withApi for uniform error envelopes
  login/                 Google OAuth plus env-gated demo login
lib/
  ai/       gateway.js   single entry point for every AI feature: cache, quota, call, fallback
            gemini.js    minimal REST client with backoff and a hard overall deadline
            json.js      repairs fenced, chatty, single-quoted, truncated model output
            heuristics.js deterministic tier for all four AI features
            quota.js     per-user daily limits and the global USD budget
  db/       index.js     repository facade with automatic failover
            supabase.js  Postgres driver (service role, server-side only)
            file.js      JSON files under .data, or memory when the disk is read-only
  ingest/   run.js       orchestrator, writes an ingestion_runs row for every attempt
            sources/     reddit, github, rss connectors that report failure instead of throwing
            cluster.js   weighted keyword clustering with a catch-all bucket
            enrich.js    Gemini brief generation, retaining prior briefs on any failure
  schemas.js             zod schemas that coerce and clamp rather than reject
  config.js              "what is configured right now", the basis of every tier decision
components/
  ui/                    shadcn-style primitives on Radix
  shell/                 icon rail, glass topbar, command palette, theme switcher, status banner
  feedback/              source badges, error panels, quota meters, empty states
supabase/migrations/     001_schema.sql: eleven core tables, RLS policies, indexes
                         002_profiles_community_roadmaps.sql: profiles, forum, saved roadmaps
```

### Data layer failover

`lib/db/index.js` picks Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
are both set, otherwise the file store. If a Supabase call fails at runtime, every method falls
back to the local store, a 30-second circuit breaker stops each subsequent request paying the
connection timeout again, and `/api/health` reports `DB_UNREACHABLE` so the UI can warn that
writes are landing locally.

### Ingestion

Sources run in parallel and each one is bounded: Reddit stops after a 403/429 (it blocks most
hosting IPs when unauthenticated) and has a 20-second ceiling, RSS feeds get 10 seconds, and
the enrichment phase has a 35-second budget so a cron run cannot exceed the serverless limit.
Any cluster that cannot be enriched keeps its previous brief, so **the feed never shrinks after
a run**. A brand new cluster with enough live evidence but no model available gets a brief
assembled from signal counts alone, labelled "Offline heuristic".

## 5. Setup

Requires Node 18.18+ (Node 20 or 22 recommended).

```bash
npm install
cp .env.local.example .env.local     # every variable is optional
npm run dev                          # http://localhost:3000
```

With an empty `.env.local` you get: the full radar from seed briefs, all four AI features on
deterministic scoring, demo login, and a JSON file store under `.data/`.

### Adding capability, one key at a time

| Add this | And you get |
| --- | --- |
| `GEMINI_API_KEY` ([free key](https://aistudio.google.com/apikey)) | Real model analysis on all four AI features, PDF resume reading, and AI-written briefs during ingestion |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google sign-in; demo login switches itself off |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Durable Postgres storage instead of local JSON |
| `GITHUB_TOKEN` | GitHub search at 30 requests/minute instead of 10 |
| `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` | Reddit as a working source; without them it is blocked from most IPs |
| `CRON_SECRET` | Scheduled daily ingestion via the Vercel cron in `vercel.json` |

Everything not listed above has a working default. See `.env.local.example` for the full,
commented list including quota ceilings.

### Supabase

1. Create a free project.
2. Copy the project URL and the **service role** key from **Settings -> API** into `.env.local`.
   `NEXT_PUBLIC_SUPABASE_URL` is the full `https://<project-ref>.supabase.co`; the bare project
   ref on its own fails every query with `Invalid supabaseUrl`.
3. Apply everything in `supabase/migrations/`, in filename order: `001_schema.sql` creates the
   eleven core tables, `002_profiles_community_roadmaps.sql` adds profiles, the community forum
   and saved roadmaps. Both are safe to re-run. Either paste them into the **SQL Editor**, or set
   `SUPABASE_DB_URL` to the session pooler string from **Connect** and run `npm run db:push`,
   which applies every migration in order. Use the pooler rather than `db.<ref>.supabase.co`,
   which is IPv6-only.
4. Optionally run `npm run db:seed` to write the bundled briefs into the empty project. Without
   it the Radar still renders from the seed, but those briefs have no rows behind them, so
   saving one to a watchlist fails a foreign key until the first ingestion run.
5. Restart the dev server. `/api/health` should now report `"driver": "supabase"`.

The service role key is used server-side only and bypasses RLS by design; the policies protect
the anon key path, which is what a browser would ever hold.

## 6. Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run db:push` | Apply `supabase/migrations/*.sql` to the project in `SUPABASE_DB_URL` |
| `npm run db:seed` | Write the bundled briefs into the configured store |
| `npm run ingest` | Run the full ingestion pipeline from the CLI and write the results |
| `npm run ingest:dry` | Collect and cluster only: no writes, no model calls |
| `npm run smoke` | 50 checks against a running server, covering every feature and the authenticated flows |
| `npm run verify:ai` | Replay 11 provider failure modes against a local stub and assert every one still returns a usable answer |
| `npm run fix:encoding` | Rewrite any cp1252-mangled source file as UTF-8 (also runs before dev and build) |

## 7. Ingestion in practice

```bash
npm run ingest:dry     # see what the sources return without touching anything
npm run ingest         # collect, cluster, enrich, upsert, log the run
```

Or trigger it from `/admin`, or let the Vercel cron call `/api/cron/ingest` daily. Every run,
including a failed one, writes an `ingestion_runs` row so `/admin` can show what happened.

A typical zero-key run collects about 60 live signals from GitHub and the two regulator feeds,
reports Reddit as blocked with the reason, retains the existing briefs because no model is
configured, and refreshes every brief's signal counts, sparkline and `last_updated`.

## 8. What is real and what is demo

Being precise about this matters more than looking impressive.

| Element | Status |
| --- | --- |
| GitHub signals | Real, live API, no credentials needed |
| RBI and SEBI circulars | Real, live RSS |
| Reddit signals | Real API, but blocked from most datacenter IPs without OAuth credentials, and reported as blocked when it is |
| Clustering, signal counts, sparklines, `last_updated` | Computed from whatever was actually collected |
| Opportunity brief prose and scores | Gemini-written when a key is configured, otherwise the bundled seed briefs, labelled accordingly |
| Idea Validator / Builder Match / Career Signal / Roadmap / Copilot | Gemini when configured and under quota, otherwise deterministic scoring, always labelled |
| Community discussions, votes and replies | Real rows; nothing is seeded, so the forum starts empty |
| Sign-in | Real Google OAuth when configured; demo login otherwise |
| Storage | Real Postgres when configured; JSON files under `.data/` otherwise, and `/tmp` on Vercel where it is ephemeral |
| Cost and token figures in `/admin` | Real, recorded per call in `api_usage` |

## 9. Limits

- Gemini free tier is small. Prompts are compact, identical requests are cached for 24 hours,
  per-user daily quotas are enforced, and a global USD budget (`GLOBAL_DAILY_LLM_BUDGET_USD`,
  default 0.50) stops all model spend for the day when reached.
- Without Supabase on Vercel, writes go to `/tmp` and disappear when the instance recycles. The
  UI says so rather than pretending the save was durable.
- Reddit will usually be skipped in a cloud deployment unless you add OAuth credentials.
- The catch-all cluster's synthesized brief is deliberately shallow: it reports signal volume
  and recurring terms, and scores nothing it cannot measure.

## 10. Deployment

`docs/DEPLOY.md` is the full checklist: every environment variable, the Google OAuth
redirect URI, Supabase migrations, cron, verification and a troubleshooting table.
Short version:

```bash
npm run build && npm run start && npm run smoke   # prove it locally first
git init && git push                              # Vercel deploys from a repo
```

Import the repo at [vercel.com/new](https://vercel.com/new), add the environment
variables with `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` set to the deployed origin, add
`https://<app>.vercel.app/api/auth/callback/google` to the Google OAuth client, and set
`CRON_SECRET` to enable the daily cron already declared in `vercel.json`.

After deploying, open `/api/health`: it names the tier every subsystem is running in.

## 11. Documentation

| Document | Contents |
| --- | --- |
| `docs/WORKFLOW.md` | End-to-end walkthrough: local setup, every feature, ingestion, deployment |
| `docs/DEPLOY.md` | Hosting checklist: environment variables, OAuth redirect URIs, cron, verification |
| `docs/TEST_CASES.md` | Each assignment requirement mapped to the evidence that satisfies it |
| `docs/ERROR_MATRIX.md` | Every failure mode, its user-visible behaviour, and how to reproduce it |
