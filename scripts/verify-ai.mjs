import { spawn } from 'node:child_process';

/**
 * Verifies the AI gateway's failure matrix without spending real quota.
 *
 * For each scenario it starts scripts/gemini-stub.mjs, points GEMINI_BASE_URL at
 * it, runs one idea-validator call in a fresh child process, and asserts the
 * resulting meta.source / meta.cause. A run that ends "all N scenarios behaved
 * as expected" means every degradation path still produces a usable answer.
 *
 * Usage: npm run verify:ai
 */

const RUNNER = `
import { runAi } from '@/lib/ai/gateway';
import { loadOpportunities } from '@/lib/opportunities';
const { opportunities } = await loadOpportunities();
const t0 = Date.now();
const r = await runAi({
  feature: 'idea-validator',
  userId: 'verify-' + process.env.SCENARIO,
  input: { idea: 'GST input tax credit recovery for Indian MSMEs, case ' + process.env.SCENARIO + ' ' + Date.now() },
  corpus: opportunities,
  forceLive: true,
});
console.log(JSON.stringify({
  source: r.meta.source,
  cause: r.meta.cause || null,
  repair: r.meta.jsonRepair || null,
  score: r.data.validationScore,
  reason: r.meta.degradedReason || null,
  ms: Date.now() - t0,
}));
`;

/** Each case: the stub behaviour, and what the gateway must do about it. */
const CASES = [
  { scenario: 'good', expect: { source: 'live' }, note: 'clean JSON' },
  { scenario: 'fenced', expect: { source: 'live' }, note: 'markdown-fenced JSON' },
  { scenario: 'chatty', expect: { source: 'live' }, note: 'JSON wrapped in prose' },
  { scenario: 'truncated', expect: { source: 'live' }, note: 'cut off mid-object' },
  { scenario: 'garbage', expect: { source: 'fallback', cause: 'invalid-json' }, note: 'refusal, no JSON' },
  { scenario: 'empty', expect: { source: 'fallback', cause: 'invalid-json' }, note: 'valid but empty object' },
  { scenario: 'rate-limit', expect: { source: 'fallback', cause: 'rate-limited' }, note: '429 on every attempt' },
  { scenario: 'bad-key', expect: { source: 'fallback', cause: 'provider-error' }, note: 'invalid API key' },
  { scenario: 'server-error', expect: { source: 'fallback', cause: 'provider-error' }, note: '503 overloaded' },
  { scenario: 'html', expect: { source: 'fallback', cause: 'provider-error' }, note: 'non-JSON gateway error' },
  { scenario: 'hang', expect: { source: 'fallback', cause: 'provider-error' }, note: 'accepts, never replies' },
];

/** A hanging provider must not hold the request longer than this. */
const MAX_ACCEPTABLE_MS = 30_000;

function spawnQuiet(command, args, env) {
  return spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function runCase({ scenario, expect, note }, port) {
  const stub = spawnQuiet(process.execPath, ['scripts/gemini-stub.mjs'], {
    SCENARIO: scenario,
    PORT: String(port),
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const runner = spawnQuiet(
    process.execPath,
    ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--import', './scripts/bootstrap-cli.mjs', '-e', RUNNER],
    {
      SCENARIO: scenario,
      GEMINI_API_KEY: 'stub-key-for-verification',
      GEMINI_BASE_URL: `http://127.0.0.1:${port}/v1beta/models`,
      // The stub store keeps these calls out of the real .data directory.
      FREE_DAILY_VALIDATIONS: '99',
    }
  );

  let stdout = '';
  let stderr = '';
  runner.stdout.on('data', (chunk) => (stdout += chunk));
  runner.stderr.on('data', (chunk) => (stderr += chunk));

  const exitCode = await new Promise((resolve) => runner.on('close', resolve));
  stub.kill();

  if (exitCode !== 0) {
    return { scenario, note, ok: false, detail: `runner exited ${exitCode}: ${stderr.trim().split('\n').pop()}` };
  }

  let actual;
  try {
    actual = JSON.parse(stdout.trim().split('\n').pop());
  } catch {
    return { scenario, note, ok: false, detail: `unparseable runner output: ${stdout.slice(0, 120)}` };
  }

  const mismatches = Object.entries(expect)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key, value]) => `${key} expected ${value}, got ${actual[key]}`);

  // Every tier must still yield a scored answer, and none may stall the caller.
  if (!(actual.score > 0)) mismatches.push('no usable score was returned');
  if (actual.ms > MAX_ACCEPTABLE_MS) mismatches.push(`took ${actual.ms}ms, over the ${MAX_ACCEPTABLE_MS}ms ceiling`);

  return {
    scenario,
    note,
    ok: mismatches.length === 0,
    detail: mismatches.join('; '),
    actual,
  };
}

console.log('Verifying AI gateway degradation against the stub provider\n');

const results = [];
let port = 4321;

for (const testCase of CASES) {
  const result = await runCase(testCase, port++);
  results.push(result);

  const label = `${result.scenario} (${result.note})`.padEnd(38);
  const summary = result.actual
    ? `${result.actual.source}${result.actual.cause ? '/' + result.actual.cause : ''}` +
      `${result.actual.repair ? ' repair=' + result.actual.repair : ''} score=${result.actual.score} ${result.actual.ms}ms`
    : '';

  console.log(`  ${result.ok ? 'PASS' : 'FAIL'}  ${label} ${summary}`);
  if (!result.ok) console.log(`        ${result.detail}`);
}

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length === 0
    ? `\nAll ${results.length} scenarios behaved as expected: every failure still returned a scored answer.`
    : `\n${failed.length} of ${results.length} scenarios did not behave as expected.`
);

process.exit(failed.length === 0 ? 0 : 1);
