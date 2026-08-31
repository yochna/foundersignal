/**
 * CLI ingestion runner: `npm run ingest`
 *
 * Exists for parity with the original pipeline script and so the feed can be
 * refreshed without a running server or an admin session. Exits 0 on success or
 * partial success, 1 only when nothing could be written, so it is usable in CI.
 *
 * Flags:
 *   --dry     collect and cluster, but do not call the model or write anything
 *   --json    print the machine-readable report instead of the human summary
 */

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry') || args.has('--dry-run');
const asJson = args.has('--json');

function line(char = '-') {
  return char.repeat(64);
}

async function main() {
  const { configSnapshot } = await import('@/lib/config');
  const config = configSnapshot();

  if (!asJson) {
    console.log(line('='));
    console.log('FounderSignal ingestion');
    console.log(line('='));
    console.log(`store          : ${config.db.supabase ? 'supabase' : 'local file store'}`);
    console.log(`ai enrichment  : ${config.ai.gemini ? `gemini (${config.ai.model})` : 'disabled, briefs will be retained'}`);
    console.log(`reddit         : ${config.sources.redditAuth ? 'oauth' : 'public endpoint'}`);
    console.log(`github         : ${config.sources.githubToken ? 'token' : 'anonymous (low rate limit)'}`);
    console.log(`rss feeds      : ${config.sources.rssFeeds}`);
    console.log(line());
  }

  if (dryRun) {
    const { fetchRedditSignals } = await import('@/lib/ingest/sources/reddit');
    const { fetchGithubSignals } = await import('@/lib/ingest/sources/github');
    const { fetchRssSignals } = await import('@/lib/ingest/sources/rss');
    const { clusterSignals, summarizeClusters } = await import('@/lib/ingest/cluster');
    const { seedSignals } = await import('@/lib/seed/signals');

    const results = await Promise.all([
      fetchRedditSignals(),
      fetchGithubSignals(),
      fetchRssSignals(),
    ]);

    for (const source of results) {
      console.log(
        `${source.name.padEnd(8)} ${source.status.padEnd(13)} ${String(source.items.length).padStart(
          3
        )} items  ${source.durationMs}ms${source.error ? `  ${source.error}` : ''}`
      );
    }

    const signals = [
      ...results.flatMap((r) => r.items),
      ...seedSignals.map((s) => ({ ...s, sourceFamily: 'seed' })),
    ];
    const clusters = clusterSignals(signals);

    console.log(line());
    for (const cluster of summarizeClusters(clusters)) {
      console.log(
        `${String(cluster.signalCount).padStart(3)} signals  ${cluster.id.padEnd(26)} [${cluster.sourceFamilies.join(', ')}]`
      );
    }
    console.log(line());
    console.log('Dry run complete. Nothing was written and no model calls were made.');
    return 0;
  }

  const { runIngestion } = await import('@/lib/ingest/run');
  const report = await runIngestion({ trigger: 'cli', triggeredBy: 'npm run ingest' });

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  }

  console.log(line());
  console.log(`status         : ${report.status}`);
  console.log(`signals        : ${report.signalsCount} (${report.liveSignalsCount ?? 0} live)`);
  console.log(`opportunities  : ${report.opportunitiesCount}`);
  console.log(`tokens / cost  : ${report.tokensUsed ?? 0} / $${(report.costEstimate ?? 0).toFixed(6)}`);
  console.log(`duration       : ${report.durationMs}ms`);
  if (report.error) console.log(`error          : ${report.error}`);

  if (report.sources?.length) {
    console.log(line());
    for (const source of report.sources) {
      console.log(
        `${source.name.padEnd(8)} ${String(source.status).padEnd(13)} ${String(source.items).padStart(3)} items${
          source.error ? `  ${source.error}` : ''
        }`
      );
    }
  }

  if (report.enrichment?.length) {
    console.log(line());
    for (const entry of report.enrichment) {
      console.log(
        `${entry.outcome.padEnd(10)} ${entry.clusterId.padEnd(26)} ${String(entry.signals).padStart(3)} signals${
          entry.detail ? `  ${entry.detail}` : ''
        }`
      );
    }
  }

  console.log(line('='));
  console.log(
    report.status === 'failed'
      ? 'Run failed. The existing feed is unchanged.'
      : 'Run complete. Reload /radar to see the refreshed feed.'
  );

  return report.ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    // runIngestion is designed not to throw, so reaching here means a genuine
    // programming or environment fault worth showing in full.
    console.error('\nIngestion CLI crashed:');
    console.error(error);
    process.exit(1);
  });
