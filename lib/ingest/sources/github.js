import { fetchWithTimeout } from '@/lib/http';
import { github, hasGithubToken } from '@/lib/config';

/**
 * GitHub connector. Searches repositories and recent issues for the themes the
 * clusters care about. Unauthenticated search is limited to 10 requests/minute,
 * so query count stays small and a 403 is treated as an expected outcome.
 */

const REPO_QUERIES = [
  'llm observability proxy cost',
  'legacy code migration ast transform',
  'gst invoice reconciliation india',
  'upi payment fraud detection',
  'compliance audit automation rbi',
];

const ISSUE_QUERIES = ['prompt injection agent tool', 'token cost runaway agent loop'];

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'FounderSignalBot/1.0',
    ...(hasGithubToken ? { Authorization: `Bearer ${github.token}` } : {}),
  };
}

export async function fetchGithubSignals() {
  const started = Date.now();
  const items = [];
  const failures = [];
  let rateLimited = false;

  for (const q of REPO_QUERIES) {
    if (rateLimited) break;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      `${q} pushed:>2026-01-01`
    )}&sort=updated&per_page=5`;

    try {
      const response = await fetchWithTimeout(url, { headers: headers() }, 12_000);

      // 403 on search is nearly always the unauthenticated rate limit rather
      // than a permissions problem.
      if (response.status === 403 || response.status === 429) {
        rateLimited = true;
        failures.push(
          `${response.status} rate limited${hasGithubToken ? '' : ' (no GITHUB_TOKEN set)'}`
        );
        break;
      }
      if (!response.ok) {
        failures.push(`${response.status} on repos "${q}"`);
        continue;
      }

      const json = await response.json();
      for (const repo of json.items || []) {
        if (!repo?.full_name) continue;
        items.push({
          source: 'GitHub (repositories)',
          sourceFamily: 'github',
          text: `${repo.full_name}: ${repo.description || 'No description'}${
            repo.topics?.length ? ` [${repo.topics.slice(0, 6).join(', ')}]` : ''
          }`,
          url: repo.html_url || null,
          publishedAt: repo.pushed_at ? repo.pushed_at.slice(0, 10) : null,
          engagement: Number(repo.stargazers_count) || 0,
          query: q,
        });
      }
    } catch (error) {
      failures.push(`${error.name === 'AbortError' ? 'timeout' : error.message} on repos "${q}"`);
    }
  }

  for (const q of ISSUE_QUERIES) {
    if (rateLimited) break;
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
      `${q} in:title,body type:issue`
    )}&sort=created&per_page=5`;

    try {
      const response = await fetchWithTimeout(url, { headers: headers() }, 12_000);
      if (response.status === 403 || response.status === 429) {
        rateLimited = true;
        break;
      }
      if (!response.ok) {
        failures.push(`${response.status} on issues "${q}"`);
        continue;
      }

      const json = await response.json();
      for (const issue of json.items || []) {
        if (!issue?.title) continue;
        items.push({
          source: 'GitHub (issues)',
          sourceFamily: 'github',
          text: `${issue.title} - ${String(issue.body || '')
            .slice(0, 300)
            .replace(/\s+/g, ' ')}`.trim(),
          url: issue.html_url || null,
          publishedAt: issue.created_at ? issue.created_at.slice(0, 10) : null,
          engagement: Number(issue.comments) || 0,
          query: q,
        });
      }
    } catch (error) {
      failures.push(`${error.name === 'AbortError' ? 'timeout' : error.message} on issues "${q}"`);
    }
  }

  return {
    name: 'github',
    ok: items.length > 0,
    mode: hasGithubToken ? 'token' : 'anonymous',
    items,
    status: items.length > 0 ? 'ok' : rateLimited ? 'rate-limited' : failures.length ? 'failed' : 'empty',
    error: failures.length > 0 ? failures.slice(0, 4).join('; ') : null,
    durationMs: Date.now() - started,
  };
}

export default fetchGithubSignals;
