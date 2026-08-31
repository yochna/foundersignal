/**
 * Single source of truth for "what is actually configured right now".
 *
 * Nothing in this file throws. Every consumer asks a boolean and picks a tier,
 * which is what lets the app boot with a completely empty .env.local.
 */

function str(value, fallback = '') {
  const v = (value ?? '').toString().trim();
  return v.length > 0 ? v : fallback;
}

function int(value, fallback) {
  const n = Number.parseInt(str(value), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function float(value, fallback) {
  const n = Number.parseFloat(str(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function bool(value) {
  return ['1', 'true', 'yes', 'on'].includes(str(value).toLowerCase());
}

export const isProd = process.env.NODE_ENV === 'production';
export const isVercel = Boolean(process.env.VERCEL);

export const appUrl = str(
  process.env.NEXT_PUBLIC_APP_URL,
  str(process.env.NEXTAUTH_URL, 'http://localhost:3000')
);

// --- Auth -------------------------------------------------------------------
export const google = {
  clientId: str(process.env.GOOGLE_CLIENT_ID),
  clientSecret: str(process.env.GOOGLE_CLIENT_SECRET),
};
export const hasGoogleAuth = Boolean(google.clientId && google.clientSecret);

// Direct email sign-in is enabled by default so users can sign in with either
// Google or direct email. Set ALLOW_DEMO_LOGIN=false to restrict to Google only.
export const allowDemoLogin = process.env.ALLOW_DEMO_LOGIN !== 'false';

// Shared admin password for the credentials sign-in form, stored as
// "salt:hash" (both hex) produced by scripts/hash-admin-password.mjs. Never
// put a plaintext password here. If this is empty the credentials provider
// refuses to register at all (see lib/auth.js) — there is no "no password
// configured, allow anyone in" fallback.
export const adminPasswordHash = str(process.env.ADMIN_PASSWORD_HASH);
export const hasAdminPassword = Boolean(adminPasswordHash);

export const nextAuthSecret = str(
  process.env.NEXTAUTH_SECRET,
  'foundersignal-insecure-development-secret-change-me'
);
export const hasNextAuthSecret = Boolean(str(process.env.NEXTAUTH_SECRET));

export const adminEmails = Array.from(
  new Set([
    'mail.jaiswal@gmail.com',
    ...str(process.env.ADMIN_EMAILS)
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ])
);

// --- Database ---------------------------------------------------------------
/**
 * Supabase shows the project ref next to the URL in the dashboard, so pasting
 * the ref alone is an easy mistake. It costs one regex to accept it rather than
 * failing every query with "Invalid supabaseUrl".
 */
function supabaseUrl(value) {
  const raw = str(value).replace(/\/+$/, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9]{16,}$/i.test(raw)) return `https://${raw}.supabase.co`;
  return `https://${raw}`;
}

export const supabase = {
  url: supabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
  anonKey: str(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  ),
  serviceRoleKey: str(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY
  ),
};
export const hasSupabase = Boolean(
  process.env.SUPABASE_ENABLED !== 'false' &&
  supabase.url &&
  supabase.serviceRoleKey
);

// --- AI ---------------------------------------------------------------------
export const gemini = {
  apiKey: str(process.env.GEMINI_API_KEY),
  model: str(process.env.GEMINI_MODEL, 'gemini-3.6-flash'),
  fallbackModels: str(process.env.GEMINI_MODEL_FALLBACKS, 'gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.7-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  /**
   * Thinking tokens are billed against maxOutputTokens on 2.5 and 3.x models, so
   * a long structured brief can spend its whole budget reasoning and come back
   * truncated or empty. These prompts are extraction and scoring rather than
   * multi-step reasoning, so the default spends the budget on the answer.
   * Set GEMINI_THINKING_BUDGET=-1 for dynamic thinking, or a token count.
   */
  thinkingBudget: (() => {
    const raw = str(process.env.GEMINI_THINKING_BUDGET, '0');
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  })(),
  // Overridable so a proxy, or a local stub during testing, can stand in for
  // the real endpoint without touching the client.
  baseUrl: str(
    process.env.GEMINI_BASE_URL,
    'https://generativelanguage.googleapis.com/v1beta/models'
  ).replace(/\/+$/, ''),
};
export const hasGemini = Boolean(gemini.apiKey);

export const openai = { apiKey: str(process.env.OPENAI_API_KEY), model: 'gpt-4o-mini' };
export const hasOpenai = Boolean(openai.apiKey);

export const perplexity = {
  apiKey: str(process.env.PERPLEXITY_API_KEY),
  model: 'llama-3.1-sonar-large-128k-online',
};
export const hasPerplexity = Boolean(perplexity.apiKey);

// --- Payments (Razorpay) -----------------------------------------------------
export const razorpay = {
  keyId: str(process.env.RAZORPAY_KEY_ID),
  keySecret: str(process.env.RAZORPAY_KEY_SECRET),
  webhookSecret: str(process.env.RAZORPAY_WEBHOOK_SECRET),
};
export const hasRazorpay = Boolean(razorpay.keyId && razorpay.keySecret);

// --- Signal sources ---------------------------------------------------------
export const reddit = {
  clientId: str(process.env.REDDIT_CLIENT_ID),
  clientSecret: str(process.env.REDDIT_CLIENT_SECRET),
  userAgent: str(process.env.REDDIT_USER_AGENT, 'FounderSignalBot/1.0'),
};
export const hasRedditAuth = Boolean(reddit.clientId && reddit.clientSecret);

export const github = { token: str(process.env.GITHUB_TOKEN) };
export const hasGithubToken = Boolean(github.token);

export const rssFeeds = [
  { name: 'RBI Press Releases', url: str(process.env.RBI_RSS_URL, 'https://www.rbi.org.in/pressreleases_rss.xml'), agency: 'RBI' },
  { name: 'SEBI Updates', url: str(process.env.SEBI_RSS_URL, 'https://www.sebi.gov.in/sebirss.xml'), agency: 'SEBI' },
].filter((f) => f.url);

// --- Ingestion --------------------------------------------------------------
export const cronSecret = str(process.env.CRON_SECRET);
export const hasCronSecret = Boolean(cronSecret);

// --- Quotas -----------------------------------------------------------------
export const quotas = {
  validations: int(process.env.FREE_DAILY_VALIDATIONS, 5),
  resumeScans: int(process.env.FREE_DAILY_RESUME_SCANS, 2),
  chatMessages: int(process.env.FREE_DAILY_CHAT_MESSAGES, 20),
  matches: int(process.env.FREE_DAILY_MATCHES, 5),
  roadmaps: int(process.env.FREE_DAILY_ROADMAPS, 5),
  globalBudgetUsd: float(process.env.GLOBAL_DAILY_LLM_BUDGET_USD, 0.5),
  cacheTtlHours: int(process.env.AI_CACHE_TTL_HOURS, 24),
};

/** Feature key -> daily limit for a signed-in user. */
export const featureQuota = {
  'idea-validator': quotas.validations,
  'career-signal': quotas.resumeScans,
  chat: quotas.chatMessages,
  'builder-match': quotas.matches,
  roadmap: quotas.roadmaps,
  // Ingestion is admin-triggered and budget-capped rather than count-capped.
  ingest: 50,
};

/** Upload ceiling for resume files, in bytes. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Snapshot for /api/health and the in-app status banner. Deliberately contains
 * no secrets, only which tier each subsystem is running in.
 */
export function configSnapshot() {
  return {
    app: { url: appUrl, env: process.env.NODE_ENV || 'development', vercel: isVercel },
    auth: {
      google: hasGoogleAuth,
      demoLogin: allowDemoLogin && hasAdminPassword,
      secretConfigured: hasNextAuthSecret,
      adminEmails: adminEmails.length,
    },
    ai: {
      gemini: hasGemini,
      model: gemini.model,
      openaiFallback: hasOpenai,
      perplexityFallback: hasPerplexity,
    },
    db: { supabase: hasSupabase },
    payments: { razorpay: hasRazorpay },
    sources: {
      redditAuth: hasRedditAuth,
      redditPublicFallback: true,
      githubToken: hasGithubToken,
      rssFeeds: rssFeeds.length,
    },
    ingestion: { cronSecret: hasCronSecret },
    quotas,
  };
}
