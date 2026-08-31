import { cn } from '@/lib/utils';

/**
 * Shared empty state. Every list and AI surface uses this so "nothing here"
 * always looks intentional rather than broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = 'neutral',
  children,
}) {
  const toneRing = {
    neutral: 'text-on-surface-variant/35',
    primary: 'text-primary/45',
    warning: 'text-amber-signal/55',
  }[tone];

  return (
    <div
      className={cn(
        'glass flex flex-col items-center justify-center rounded-xl px-6 py-14 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="relative mb-4">
          <span
            className={cn(
              'absolute inset-0 -m-3 animate-pulse-ring rounded-full border border-current',
              toneRing
            )}
            aria-hidden="true"
          />
          <Icon className={cn('h-10 w-10', toneRing)} aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-base font-bold tracking-tight text-on-surface">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-on-surface-variant">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
      {children ? <div className="w-full max-w-sm">{children}</div> : null}
    </div>
  );
}

export default EmptyState;
