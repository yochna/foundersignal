'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SIDE_CLASSES = {
  right: 'inset-y-0 right-0 h-full w-[min(24rem,90vw)] border-l data-[state=open]:slide-in-from-right',
  left: 'inset-y-0 left-0 h-full w-[min(20rem,85vw)] border-r data-[state=open]:slide-in-from-left',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t rounded-t-2xl data-[state=open]:slide-in-from-bottom',
};

const SheetContent = React.forwardRef(function SheetContent(
  { className, children, side = 'right', ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'glass-strong fixed z-50 overflow-y-auto p-6 data-[state=open]:animate-in data-[state=closed]:animate-out',
          SIDE_CLASSES[side],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-base font-bold tracking-tight text-on-surface', className)}
      {...props}
    />
  );
});

const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('mt-1 text-xs leading-relaxed text-on-surface-variant', className)}
      {...props}
    />
  );
});

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
