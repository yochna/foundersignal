import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Surface primitive for the bento grid. `tone="glass"` picks up the per-theme
 * blur and border tokens; `tone="plain"` stays flat for dense data tables.
 */
const Card = React.forwardRef(function Card(
  { className, tone = 'glass', interactive = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl',
        tone === 'glass' && 'glass',
        tone === 'strong' && 'glass-strong',
        tone === 'plain' && 'border border-border bg-surface',
        interactive && 'tile-hover cursor-pointer',
        className
      )}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />;
});

const CardTitle = React.forwardRef(function CardTitle({ className, as: As = 'h3', ...props }, ref) {
  return (
    <As
      ref={ref}
      className={cn('text-base font-bold leading-tight tracking-tight text-on-surface', className)}
      {...props}
    />
  );
});

const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return (
    <p ref={ref} className={cn('text-xs leading-relaxed text-on-surface-variant', className)} {...props} />
  );
});

const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />;
});

const CardFooter = React.forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 border-t border-border/60 p-5', className)}
      {...props}
    />
  );
});

/** Small uppercase label used on every KPI tile. */
function CardEyebrow({ className, children, icon: Icon }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant',
        className
      )}
    >
      <span>{children}</span>
      {Icon ? <Icon className="h-4 w-4 opacity-70" aria-hidden="true" /> : null}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardEyebrow };
