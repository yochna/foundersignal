'use client';

import * as React from 'react';
import { Palette, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/shell/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ align = 'end', compact = false }) {
  const { theme, setTheme, themes } = useTheme();
  const active = themes.find((t) => t.id === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-border bg-surface-low text-xs font-bold text-on-surface transition-colors hover:border-primary/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          compact ? 'h-9 w-9 justify-center' : 'h-9 px-3'
        )}
        aria-label={`Theme: ${active.name}. Change theme`}
      >
        <Palette className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
        {!compact ? <span className="truncate">{active.name}</span> : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="max-h-[70vh] w-64 overflow-y-auto">
        <DropdownMenuLabel>Visual theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t, index) => {
          const isActive = t.id === theme;
          // Themes arrive grouped dark-first; label the boundary rather than
          // making the reader infer it from the swatches.
          const startsGroup = index === 0 || themes[index - 1].mode !== t.mode;
          return (
            <React.Fragment key={`${t.id}-group`}>
              {startsGroup ? (
                <DropdownMenuLabel className="pt-2 text-[9px] opacity-60">
                  {t.mode === 'dark' ? 'Dark' : 'Light'}
                </DropdownMenuLabel>
              ) : null}
              <DropdownMenuItem
                onSelect={() => setTheme(t.id)}
                className={cn(
                  'items-start gap-2.5 py-2.5',
                  isActive && 'bg-surface-low text-on-surface'
                )}
              >
                <span className="mt-0.5 flex shrink-0 gap-0.5" aria-hidden="true">
                  {t.swatch.map((color) => (
                    <span
                      key={color}
                      className="h-3.5 w-2 rounded-sm ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface">{t.name}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                      {t.tagline}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug text-on-surface-variant">
                    {t.description}
                  </span>
                </span>
                {isActive ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> : null}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSwitcher;
