'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { NAV_GROUPS, NAV_ITEMS, isActivePath } from '@/lib/nav';
import { BrandMark } from '@/components/shell/brand';
import { ThemeSwitcher } from '@/components/shell/theme-switcher';
import { cn } from '@/lib/utils';

/**
 * Desktop navigation rail.
 *
 * Collapsed to 4.5rem of icons by default and expands to 16rem on hover or
 * keyboard focus. This keeps the analytical content as wide as possible, which
 * matters for the dense opportunity tables.
 */
export function SideRail({ isAuthed, isAdmin, savedCount = 0 }) {
  const pathname = usePathname();

  const visible = NAV_ITEMS.filter((item) => !item.requiresAdmin || isAdmin);

  return (
    <aside
      className={cn(
        'group/rail fixed inset-y-0 left-0 z-40 hidden md:flex md:flex-col',
        'w-[4.5rem] hover:w-64 focus-within:w-64',
        'glass border-r border-border transition-[width] duration-300 ease-out'
      )}
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center overflow-hidden px-4">
        <Link
          href="/radar"
          className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary p-1.5 text-on-primary">
            <BrandMark />
          </span>
          <span className="ml-2.5 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
            <span className="block text-[15px] font-black leading-tight tracking-tight text-on-surface">
              Founder<span className="text-primary">Signal</span>
            </span>
            <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant/80">
              India opportunity radar
            </span>
          </span>
        </Link>
      </div>

      <nav className="hide-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((item) => item.group === group);
          if (items.length === 0) return null;

          return (
            <div key={group} className="mb-4 last:mb-0">
              <p
                className={cn(
                  'mb-1.5 h-3 overflow-hidden px-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant/55',
                  'opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100'
                )}
              >
                {group}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  const locked = item.requiresAuth && !isAuthed;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        title={item.label}
                        className={cn(
                          'relative flex h-10 items-center gap-3 overflow-hidden rounded-lg px-2.5 text-xs font-bold transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
                          {item.label}
                        </span>

                        {item.href === '/saved' && savedCount > 0 ? (
                          <span
                            className={cn(
                              'ml-auto shrink-0 rounded-full px-1.5 text-[10px] font-black tabular-nums',
                              active ? 'bg-on-primary/20' : 'bg-rose-signal text-white'
                            )}
                          >
                            {savedCount}
                          </span>
                        ) : null}

                        {locked ? (
                          <Lock
                            className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/rail:opacity-50 group-focus-within/rail:opacity-50"
                            aria-hidden="true"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="overflow-hidden border-t border-border/60 p-3">
        <div className="opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
          <ThemeSwitcher align="start" />
        </div>
        <div className="group-hover/rail:hidden group-focus-within/rail:hidden">
          <ThemeSwitcher align="start" compact />
        </div>
      </div>
    </aside>
  );
}

export default SideRail;
