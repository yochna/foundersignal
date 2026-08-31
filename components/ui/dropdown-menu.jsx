'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  { className, sideOffset = 6, align = 'end', ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'glass-strong z-50 min-w-[190px] overflow-hidden rounded-xl p-1.5',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-on-surface-variant outline-none transition-colors',
        'focus:bg-surface-low focus:text-on-surface data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:size-3.5',
        className
      )}
      {...props}
    />
  );
});

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuRadioItem = React.forwardRef(function DropdownMenuRadioItem(
  { className, children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-8 pr-2.5 text-xs font-semibold text-on-surface-variant outline-none transition-colors',
        'focus:bg-surface-low focus:text-on-surface data-[state=checked]:text-on-surface',
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70',
        className
      )}
      {...props}
    />
  );
});

const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1.5 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
