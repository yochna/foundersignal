'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-on-primary shadow-sm hover:opacity-90 active:scale-[0.98]',
        secondary:
          'bg-surface-low text-on-surface border border-border hover:border-primary/40 hover:bg-surface-high active:scale-[0.98]',
        outline:
          'border border-border bg-transparent text-on-surface-variant hover:text-on-surface hover:border-primary/40 hover:bg-surface-low',
        ghost: 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface',
        danger: 'bg-rose-signal text-white hover:opacity-90 active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-[11px] [&_svg]:size-3.5',
        md: 'h-10 px-4 [&_svg]:size-4',
        lg: 'h-12 px-6 text-sm [&_svg]:size-4',
        icon: 'h-9 w-9 [&_svg]:size-4',
        'icon-sm': 'h-7 w-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { Button, buttonVariants };
