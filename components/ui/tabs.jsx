'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'hide-scrollbar inline-flex h-10 items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface-low p-1',
        className
      )}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant transition-all',
        'hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-sm',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5',
        className
      )}
      {...props}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('mt-5 animate-fade-up focus-visible:outline-none', className)}
      {...props}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
