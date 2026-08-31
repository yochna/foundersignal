'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(function TooltipContent(
  { className, sideOffset = 6, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'glass-strong z-50 max-w-[240px] rounded-lg px-2.5 py-1.5 text-[11px] font-medium leading-snug text-on-surface',
          'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

/** Convenience wrapper: <InfoTip label="...">trigger</InfoTip> */
function InfoTip({ label, children, side = 'top', delayDuration = 200 }) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, InfoTip };
