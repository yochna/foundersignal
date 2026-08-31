'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Sparkles, Crown } from 'lucide-react';
import { BrandMark } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { UserMenu } from '@/components/shell/user-menu';
import { CommandPalette } from '@/components/shell/command-palette';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/context/subscription-context';

/**
 * Sticky glass header. Owns the global search affordance, keyboard shortcuts,
 * and Pro plan status indicators.
 */
export function Topbar({ user, isAdmin }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const { isPro, openPricingModal } = useSubscription();

  React.useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      // "/" opens search unless the user is typing in a field.
      if (event.key === '/' && !paletteOpen) {
        const tag = document.activeElement?.tagName;
        const editable = document.activeElement?.isContentEditable;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !editable) {
          event.preventDefault();
          setPaletteOpen(true);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-3 px-4 sm:px-6">
          {/* Brand shows on mobile only; the desktop rail already has it. */}
          <Link
            href="/radar"
            className="flex items-center gap-2 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary p-1.5 text-on-primary">
              <BrandMark animated={false} />
            </span>
            <span className="text-sm font-black tracking-tight text-on-surface">
              Founder<span className="text-primary">Signal</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group ml-auto flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-surface-low px-3 text-left transition-colors hover:border-primary/40 md:ml-0 md:max-w-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Search opportunities and tools"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
            <span className="hidden truncate text-xs text-on-surface-variant/70 sm:block">
              Search opportunities, tools, sectors 
            </span>
            <kbd className="mono ml-auto hidden shrink-0 items-center gap-1 rounded border border-border bg-surface-lowest px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant md:flex">
              <span>Ctrl</span>
              <span className="text-[9px] text-on-surface-variant/70">+</span>
              <span>K</span>
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            {/* Pro Plan Trigger Badge / Button */}
            {isPro ? (
              <Badge variant="emerald" className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 font-bold text-[11px] shadow-sm">
                <Crown className="h-3 w-3 text-emerald-400" />
                <span>Founder Pro</span>
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={openPricingModal}
                className="hidden sm:inline-flex items-center gap-1 font-bold shadow-md shadow-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span>Unlock Pro</span>
              </Button>
            )}

            <div className="md:hidden">
              <ThemeSwitcher compact />
            </div>
            <UserMenu user={user} isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} isAdmin={isAdmin} />
    </>
  );
}

export default Topbar;
