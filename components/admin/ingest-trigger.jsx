'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Terminal, ChevronDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

const STATUS_PRESENTATION = {
  success: { icon: CheckCircle2, variant: 'emerald', text: 'Run succeeded' },
  partial: { icon: AlertTriangle, variant: 'amber', text: 'Run partially succeeded' },
  failed: { icon: XCircle, variant: 'rose', text: 'Run failed' },
};

/**
 * Triggers a live ingestion run and shows the resulting log inline, because the
 * interesting part of a run is usually which sources failed and why.
 */
export function IngestTrigger() {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [report, setReport] = React.useState(null);
  const [showLog, setShowLog] = React.useState(false);

  async function trigger() {
    setRunning(true);
    setReport(null);

    const toastId = toast.loading('Ingestion running', {
      description: 'Querying Reddit, GitHub and the regulator feeds.',
    });

    // A full run can approach the 60s function ceiling, so the client waits
    // slightly longer than the server is allowed to take.
    const response = await api.post('/api/admin/ingest', {}, { timeoutMs: 90_000 });
    setRunning(false);

    if (!response.ok) {
      toast.error('Ingestion could not start', {
        id: toastId,
        description: response.error?.message,
      });
      return;
    }

    const result = response.data.report;
    setReport(result);
    setShowLog(result.status !== 'success');

    const preset = STATUS_PRESENTATION[result.status] || STATUS_PRESENTATION.partial;
    const describe = `${result.signalsCount} signals, ${result.opportunitiesCount} briefs updated`;

    if (result.status === 'failed') {
      toast.error(preset.text, { id: toastId, description: result.error || describe });
    } else if (result.status === 'partial') {
      toast.warning(preset.text, { id: toastId, description: describe });
    } else {
      toast.success(preset.text, { id: toastId, description: describe });
    }

    router.refresh();
  }

  const preset = report ? STATUS_PRESENTATION[report.status] || STATUS_PRESENTATION.partial : null;

  return (
    <div>
      <Button size="sm" onClick={trigger} loading={running} disabled={running}>
        {running ? null : <RefreshCw />}
        {running ? 'Running ingestion' : 'Run ingestion now'}
      </Button>

      {report ? (
        <Card tone="glass" className="mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 p-4">
            <Badge variant={preset.variant}>
              <preset.icon />
              {preset.text}
            </Badge>
            <span className="text-[11px] text-on-surface-variant">
              <span className="mono font-bold">{report.signalsCount}</span> signals
              {typeof report.liveSignalsCount === 'number' ? (
                <>
                  {' '}
                  (<span className="mono font-bold">{report.liveSignalsCount}</span> live)
                </>
              ) : null}
              {' \u00b7 '}
              <span className="mono font-bold">{report.opportunitiesCount}</span> briefs
              {' \u00b7 '}
              <span className="mono font-bold">{report.durationMs}</span>ms
              {report.tokensUsed ? (
                <>
                  {' \u00b7 '}
                  <span className="mono font-bold">{report.tokensUsed}</span> tokens
                </>
              ) : null}
            </span>

            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={showLog}
            >
              <Terminal className="h-3 w-3" aria-hidden="true" />
              {showLog ? 'Hide log' : 'Show log'}
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', showLog && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          </div>

          {showLog && report.log?.length ? (
            <pre className="mono max-h-64 overflow-auto border-t border-border/60 bg-surface-low/60 p-4 text-[10px] leading-relaxed text-on-surface-variant">
              {report.log.join('\n')}
            </pre>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

export default IngestTrigger;
