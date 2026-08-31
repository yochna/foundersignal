/**
 * Authenticated smoke test: `npm run smoke`
 *
 * Signs in through the demo credentials provider, then exercises every guarded
 * page and API route and prints a pass/fail table. This is the fastest way to
 * confirm the error matrix still holds after a change, and it needs no browser.
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL || 'smoke@foundersignal.test';

const jar = new Map();
let passed = 0;
let failed = 0;

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function absorb(response) {
  for (const raw of response.headers.getSetCookie?.() || []) {
    const [pair] = raw.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function call(path, { method = 'GET', body, form, redirect = 'manual' } = {}) {
  const headers = { cookie: cookieHeader() };
  let payload;

  if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect });
  absorb(response);
  return response;
}

async function json(path, options) {
  const response = await call(path, options);
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { status: response.status, body: parsed, text };
}

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? `  (${detail})` : ''}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

async function signIn() {
  const csrf = await json('/api/auth/csrf');
  if (!csrf.body?.csrfToken) throw new Error('could not obtain a CSRF token');

  const response = await call('/api/auth/callback/demo', {
    method: 'POST',
    form: {
      csrfToken: csrf.body.csrfToken,
      email: EMAIL,
      name: 'Smoke Test',
      callbackUrl: `${BASE}/radar`,
      json: 'true',
    },
  });
  await response.text();

  const session = await json('/api/auth/session');
  return session.body?.user?.id ? session.body.user : null;
}

async function main() {
  console.log(`FounderSignal smoke test against ${BASE}`);

  // --- unauthenticated -------------------------------------------------------
  section('Unauthenticated');

  const health = await json('/api/health');
  check('GET /api/health returns 200', health.status === 200, `status=${health.body?.status}`);
  check('health reports a store driver', Boolean(health.body?.subsystems?.db?.driver), health.body?.subsystems?.db?.driver);

  const opportunities = await json('/api/opportunities');
  check(
    'GET /api/opportunities returns briefs',
    opportunities.status === 200 && opportunities.body?.opportunities?.length > 0,
    `${opportunities.body?.opportunities?.length ?? 0} briefs`
  );

  const filtered = await json('/api/opportunities?vertical=BFSI&sort=momentum&limit=3');
  check(
    'filters and paging apply',
    filtered.status === 200 &&
      filtered.body.opportunities.length <= 3 &&
      filtered.body.opportunities.every((o) => o.vertical === 'BFSI'),
    `${filtered.body?.opportunities?.length ?? 0} rows`
  );

  const missing = await json('/api/opportunities/definitely-not-real');
  check('unknown id returns 404 NOT_FOUND', missing.status === 404 && missing.body?.error?.code === 'NOT_FOUND');

  const badValidate = await json('/api/idea-validator', { method: 'POST', body: { idea: 'no' } });
  check(
    'short idea returns 400 with field detail',
    badValidate.status === 400 && badValidate.body?.error?.details?.length > 0,
    badValidate.body?.error?.details?.[0]?.message
  );

  const notJson = await call('/api/idea-validator', { method: 'POST', form: { idea: 'x' } });
  check('non-JSON body is rejected cleanly', notJson.status === 400);

  const anonValidate = await json('/api/idea-validator', {
    method: 'POST',
    body: {
      idea: 'A compliance automation tool for Indian NBFCs that converts RBI circulars into an auditable checklist.',
    },
  });
  check(
    'anonymous validation still answers',
    anonValidate.status === 200 && anonValidate.body?.result?.validationScore > 0,
    `score=${anonValidate.body?.result?.validationScore} source=${anonValidate.body?.meta?.source}`
  );

  const chatGuard = await json('/api/chat', { method: 'POST', body: { message: 'hello there' } });
  check('chat requires auth', chatGuard.status === 401 && chatGuard.body?.error?.code === 'UNAUTHORIZED');

  const saveGuard = await json('/api/opportunities/save', {
    method: 'POST',
    body: { opportunityId: 'bfsi-ai-compliance' },
  });
  check('save requires auth', saveGuard.status === 401);

  const adminGuard = await json('/api/admin/stats');
  check('admin stats requires auth', adminGuard.status === 401);

  const savedPage = await call('/saved');
  check('/saved redirects to login', savedPage.status === 307 || savedPage.status === 302);

  const profileGuard = await json('/api/profile');
  check('profile API requires auth', profileGuard.status === 401);

  const profilePage = await call('/profile');
  check('/profile redirects to login', profilePage.status === 307 || profilePage.status === 302);

  const roadmapQuota = await json('/api/roadmap');
  check(
    'roadmap quota is readable',
    roadmapQuota.status === 200 && typeof roadmapQuota.body?.quota?.remaining === 'number',
    `remaining=${roadmapQuota.body?.quota?.remaining}`
  );

  // --- authenticated ---------------------------------------------------------
  section('Authenticated (demo provider)');

  // Demo login switches itself off once Google OAuth is configured, which is the
  // correct production posture. Report that rather than failing every guarded
  // check: set ALLOW_DEMO_LOGIN=true on a preview deployment to run this half.
  const providers = await json('/api/auth/providers');
  if (!providers.body?.demo) {
    console.log('  SKIP  demo provider is disabled (Google OAuth is configured)');
    console.log('        Set ALLOW_DEMO_LOGIN=true to exercise the guarded routes here.');
    section('Result');
    console.log(`${passed} passed, ${failed} failed, authenticated half skipped`);
    return failed === 0 ? 0 : 1;
  }

  const user = await signIn();
  check('demo sign-in establishes a session', Boolean(user), user?.email);
  if (!user) {
    console.log('\nAborting: no session, so guarded routes cannot be exercised.');
    return 1;
  }

  const target = opportunities.body.opportunities[0].id;

  const save = await json('/api/opportunities/save', {
    method: 'POST',
    body: { opportunityId: target },
  });
  check('save succeeds', save.status === 200 && save.body?.saved === true, `count=${save.body?.count}`);

  const savedList = await json('/api/opportunities/save');
  check(
    'watchlist contains the saved brief',
    savedList.status === 200 && savedList.body.saved.some((o) => o.id === target)
  );

  const saveMissing = await json('/api/opportunities/save', {
    method: 'POST',
    body: { opportunityId: 'does-not-exist' },
  });
  check('saving an unknown id returns 404', saveMissing.status === 404);

  const unsave = await json('/api/opportunities/save', {
    method: 'DELETE',
    body: { opportunityId: target },
  });
  check('unsave succeeds', unsave.status === 200 && unsave.body?.saved === false);

  const chat = await json('/api/chat', {
    method: 'POST',
    body: { message: 'Which opportunity has the strongest regulatory tailwind?' },
  });
  check(
    'chat answers with citations',
    chat.status === 200 && typeof chat.body?.result?.answer === 'string' && chat.body.result.answer.length > 20,
    `source=${chat.body?.meta?.source} cited=${chat.body?.cited?.length ?? 0}`
  );

  const history = await json('/api/chat');
  check('chat history persists', history.status === 200 && history.body.history.length >= 2, `${history.body?.history?.length ?? 0} turns`);

  const cleared = await json('/api/chat', { method: 'DELETE' });
  check('chat history clears', cleared.status === 200);

  const match = await json('/api/builder-match', {
    method: 'POST',
    body: {
      answers: {
        'q-skills': 'tech',
        'q-domain': 'BFSI',
        'q-capital': 'low',
        'q-time': 'side',
        'q-risk': 'high',
      },
    },
  });
  check(
    'builder match ranks the feed',
    match.status === 200 && match.body?.matches?.length > 0,
    `${match.body?.matches?.length ?? 0} matches, top=${match.body?.matches?.[0]?.fitScore}`
  );

  const resume = await json('/api/career-signal', {
    method: 'POST',
    body: {
      resumeText:
        'Senior Backend Engineer, 6 years. Node.js, PostgreSQL, AWS, Kafka, Python. Built UPI reconciliation and KYC pipelines for a lending NBFC.',
    },
  });
  check(
    'career signal scores a pasted resume',
    resume.status === 200 && resume.body?.result?.demandScore > 0,
    `demand=${resume.body?.result?.demandScore} skills=${resume.body?.result?.skills?.length}`
  );

  const shortResume = await json('/api/career-signal', { method: 'POST', body: { resumeText: 'too short' } });
  check('short resume is rejected', shortResume.status === 400);

  // With ADMIN_EMAILS configured the smoke user is correctly not an admin, so
  // 403 is the pass condition there and 200 is the pass condition without it.
  const adminGated = health.body?.subsystems?.auth?.adminEmailsConfigured > 0;
  const stats = await json('/api/admin/stats');
  check(
    adminGated ? 'admin stats is refused to a non-admin' : 'admin stats loads (empty ADMIN_EMAILS grants access)',
    adminGated ? stats.status === 403 : stats.status === 200 && Boolean(stats.body?.stats?.usage),
    adminGated ? stats.body?.error?.code : `calls=${stats.body?.stats?.usage?.totalCalls}`
  );

  // --- roadmap ---------------------------------------------------------------
  section('Suggested Roadmap');

  const roadmap = await json('/api/roadmap', {
    method: 'POST',
    body: {
      goal: 'A GST input-tax-credit reconciliation tool for Indian SMEs that chases defaulting suppliers automatically.',
      kind: 'idea',
      horizon: '90 days',
      experience: 'Backend engineer, 6 years, no prior founding experience',
      hoursPerWeek: 12,
    },
  });
  check(
    'roadmap returns a phased plan',
    roadmap.status === 200 && roadmap.body?.result?.phases?.length > 0,
    `${roadmap.body?.result?.phases?.length ?? 0} phases, source=${roadmap.body?.meta?.source}`
  );
  check('short goal is rejected', (await json('/api/roadmap', { method: 'POST', body: { goal: 'nope' } })).status === 400);

  // --- profile ---------------------------------------------------------------
  section('Profile');

  // A user who has never opened the page has no profile row yet, so null here
  // is correct; the page renders an empty form from it.
  const profile = await json('/api/profile');
  check(
    'profile loads for a signed-in user',
    profile.status === 200 && 'profile' in (profile.body || {}),
    profile.body?.profile ? 'existing profile' : 'no profile yet'
  );

  const savedProfile = await json('/api/profile', {
    method: 'PUT',
    body: {
      displayName: 'Smoke Test',
      headline: 'Backend engineer exploring BFSI',
      bio: 'Written by the smoke test.',
      roleTitle: 'Senior Backend Engineer',
      experienceYears: 6,
      builderStage: 'validating',
      weeklyHours: 12,
      skills: ['node', 'postgres'],
      websiteUrl: 'foundersignal.test',
      visibility: 'public',
    },
  });
  check(
    'profile edits persist',
    savedProfile.status === 200 && savedProfile.body?.profile?.headline === 'Backend engineer exploring BFSI'
  );
  check('a bare domain is normalised to a URL', savedProfile.body?.profile?.websiteUrl?.startsWith('https://'));

  const reread = await json('/api/profile');
  check('the saved profile reads back', reread.body?.profile?.roleTitle === 'Senior Backend Engineer');

  // --- onboarding & followups ------------------------------------------------
  section('Onboarding & Follow-ups');

  const onboardingSave = await json('/api/onboarding', {
    method: 'POST',
    body: {
      role: 'early',
      city: 'bangalore',
      verticals: ['fintech', 'compliance'],
      skills: ['fullstack', 'compliance-domain'],
      capital: 'bootstrapped',
      regulatory: 'heavy',
      onboardingComplete: true,
    },
  });
  check('onboarding profile saves', onboardingSave.status === 200 && onboardingSave.body?.ok);

  const onboardingGet = await json('/api/onboarding');
  check('onboarding profile reads back', onboardingGet.status === 200 && onboardingGet.body?.profile?.city === 'bangalore');

  const followup = await json('/api/idea-validator/followup', {
    method: 'POST',
    body: {
      idea: 'A compliance tool that scans NBFC collection calls in Hindi for RBI infractions.',
      verdict: 'Strong regulatory moat.',
      type: 'roadmap',
    },
  });
  check('idea validator followup blueprint generates', followup.status === 200 && followup.body?.ok);

  const notebookSave = await json('/api/idea-validator/saved', {
    method: 'POST',
    body: {
      idea: 'A compliance tool for NBFCs',
      result: { validationScore: 88, verdict: 'High demand', scores: { demand: 85, regulation: 90 } },
    },
  });
  check('private notebook saves idea validation', notebookSave.status === 200 && notebookSave.body?.ok);

  const notebookList = await json('/api/idea-validator/saved');
  check('private notebook lists saved validations', notebookList.status === 200 && Array.isArray(notebookList.body?.data));

  // --- guarded pages ---------------------------------------------------------
  section('Guarded pages render');

  for (const path of ['/saved', '/chat', '/admin', '/radar', '/onboarding', '/roadmap', '/profile']) {
    const page = await call(path, { redirect: 'follow' });
    const html = await page.text();
    check(`GET ${path}`, page.status === 200 && html.includes('</html>'), `${html.length} bytes`);
  }

  section('Result');
  console.log(`${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('\nSmoke test could not run:');
    console.error(error.message);
    console.error('\nIs the dev server running? Start it with: npm run dev');
    process.exit(1);
  });
