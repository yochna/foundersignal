'use client';

import { AlertTriangle, Ban, Clock, Lock, RefreshCw, WifiOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Maps an error code to an icon and heading so failures stay legible. */
const PRESENTATION = {
  UNAUTHORIZED: { icon: Lock, title: 'Sign in required', tone: 'primary' },
  FORBIDDEN: { icon: Ban, title: 'Admin access required', tone: 'warning' },
  NOT_FOUND: { icon: AlertTriangle, title: 'Not found', tone: 'neutral' },
  QUOTA_EXCEEDED: { icon: Clock, title: 'Daily free limit reached', tone: 'warning' },
  BUDGET_EXCEEDED: { icon: Clock, title: 'Shared AI budget spent for today', tone: 'warning' },
  UPSTREAM_RATE_LIMITED: { icon: Clock, title: 'Upstream is rate limiting us', tone: 'warning' },
  UPSTREAM_UNAVAILABLE: { icon: WifiOff, title: 'Upstream unreachable', tone: 'warning' },
  AI_UNAVAILABLE: { icon: Sparkles, title: 'Live AI is not configured', tone: 'primary' },
  AI_INVALID_RESPONSE: { icon: AlertTriangle, title: 'The model returned malformed output', tone: 'warning' },
  DB_UNAVAILABLE: { icon: WifiOff, title: 'Database unreachable', tone: 'warning' },
  READ_ONLY: { icon: AlertTriangle, title: 'Storage is read-only', tone: 'warning' },
  PAYLOAD_TOO_LARGE: { icon: AlertTriangle, title: 'File is too large', tone: 'warning' },
  BAD_REQUEST: { icon: AlertTriangle, title: 'Check your input', tone: 'neutral' },
  INTERNAL: { icon: AlertTriangle, title: 'Something broke on our side', tone: 'warning' },
};

const TONE_CLASSES = {
  neutral: 'border-border text-on-surface-variant',
  primary: 'border-primary/30 text-primary',
  warning: 'border-amber-signal/35 text-amber-signal',
};

export function ErrorPanel({ error, onRetry, retryLabel = 'Try again', className, children }) {
  const code = error?.code || 'INTERNAL';
  const preset = PRESENTATION[code] || PRESENTATION.INTERNAL;
  const Icon = preset.icon;

  return (
    <div
      role="alert"
      className={cn('glass rounded-xl border p-6', TONE_CLASSES[preset.tone], className)}
    >
      <div className="flex items-start gap-3.5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight text-on-surface">{preset.title}</h3>
          {error?.message ? (
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{error.message}</p>
          ) : null}
          {error?.hint ? (
            <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant/85">{error.hint}</p>
          ) : null}

          {Array.isArray(error?.details) && error.details.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {error.details.map((d, i) => (
                <li key={i} className="text-[11px] text-on-surface-variant">
                  <span className="mono font-bold text-on-surface/80">{d.path}</span> {d.message}
                </li>
              ))}
            </ul>
          ) : null}

          {error?.meta?.resetAt ? (
            <p className="mt-2 text-[11px] font-semibold text-on-surface-variant">
              Resets {new Date(error.meta.resetAt).toLocaleString('en-IN')}
            </p>
          ) : null}

          {error?.requestId ? (
            <p className="mono mt-2 text-[10px] text-on-surface-variant/60">
              Reference: {error.requestId}
            </p>
          ) : null}

          {children}

          {onRetry ? (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
              <RefreshCw />
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Compact inline variant for form-level failures. */
export function InlineError({ error, className }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className={cn('flex items-start gap-1.5 text-[11px] font-semibold text-rose-signal', className)}
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {error.message}
        {error.hint ? <span className="font-normal opacity-80"> {error.hint}</span> : null}
      </span>
    </p>
  );
}

export default ErrorPanel;
