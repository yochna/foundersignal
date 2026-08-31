import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-low text-on-surface-variant',
        primary: 'border-primary/25 bg-primary/10 text-primary',
        emerald: 'border-emerald-signal/30 bg-emerald-signal/12 text-emerald-signal',
        violet: 'border-violet-signal/30 bg-violet-signal/12 text-violet-signal',
        indigo: 'border-indigo-signal/30 bg-indigo-signal/12 text-indigo-signal',
        amber: 'border-amber-signal/30 bg-amber-signal/12 text-amber-signal',
        rose: 'border-rose-signal/30 bg-rose-signal/12 text-rose-signal',
        outline: 'border-border bg-transparent text-on-surface-variant',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
