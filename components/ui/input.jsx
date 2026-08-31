'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-surface-low px-3 py-2 text-sm text-on-surface transition-colors',
        'placeholder:text-on-surface-variant/60',
        'focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-xs file:font-bold file:text-primary',
        className
      )}
      {...props}
    />
  );
});

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[96px] w-full resize-y rounded-lg border border-border bg-surface-low px-3 py-2.5 text-sm leading-relaxed text-on-surface transition-colors',
        'placeholder:text-on-surface-variant/60',
        'focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn('text-[11px] font-bold uppercase tracking-wider text-on-surface-variant', className)}
      {...props}
    />
  );
});

/** Native select styled to match. Avoids a Radix portal for simple filters. */
const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface-low px-3 pr-8 text-xs font-bold text-on-surface transition-colors',
        'focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20',
        'bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat',
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export { Input, Textarea, Label, Select };
