'use client';

import * as React from 'react';
import { AlertTriangle, X, Sparkles, Database, ChevronRight } from 'lucide-react';
import { api } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'foundersignal-status-dismissed';

/**
 * Surfaces degraded subsystems so a demo viewer is never misled about what is
 * live. Polls /api/health once on mount; a failed poll renders nothing rather
 * than adding noise.
 */
export function StatusBanner() {
  const [health, setHealth] = React.useState(null);
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await api.get('/api/health', { timeoutMs: 6000 });
      if (cancelled || !result.ok) return;
      setHealth(result.data);

      // Re-show the banner whenever the degradation set changes.
      const signature = (result.data?.warnings || []).map((w) => w.code).sort().join('|');
      let stored = null;
      try {
        stored = window.sessionStorage.getItem(DISMISS_KEY);
      } catch {
        stored = null;
      }
      setDismissed(Boolean(signature) && stored === signature);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const warnings = health?.warnings || [];
  if (dismissed || warnings.length === 0) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(
        DISMISS_KEY,
        warnings.map((w) => w.code).sort().join('|')
      );
    } catch {
      // Ignore storage failures; dismissal just will not persist.
    }
  }

  const severity = warnings.some((w) => w.level === 'warn') ? 'warn' : 'info';

  return (
    <div
      role="status"
      className={cn(
        'glass mx-auto mb-6 flex max-w-[100rem] items-start gap-3 rounded-xl px-4 py-3',
        severity === 'warn' ? 'border-amber-signal/30' : 'border-primary/25'
      )}
    >
      {severity === 'warn' ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-signal" aria-hidden="true" />
      ) : (
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface">
          Demo mode: {warnings.length} subsystem{warnings.length === 1 ? '' : 's'} running on a fallback
        </p>
        <ul className="mt-1.5 space-y-1">
          {warnings.map((warning) => (
            <li
              key={warning.code}
              className="flex items-start gap-1.5 text-[11px] leading-relaxed text-on-surface-variant"
            >
              <ChevronRight className="mt-[3px] h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
              <span>
                <span className="font-semibold text-on-surface/85">{warning.title}. </span>
                {warning.detail}
              </span>
            </li>
          ))}
        </ul>
        {health?.subsystems ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-on-surface-variant/80">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3 w-3" aria-hidden="true" />
              store: <span className="mono">{health.subsystems.db?.driver}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              ai: <span className="mono">{health.subsystems.ai?.mode}</span>
            </span>
            <span>
              auth: <span className="mono">{health.subsystems.auth?.mode}</span>
            </span>
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Dismiss status message"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default StatusBanner;
