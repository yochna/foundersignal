'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOBILE_NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Bottom tab bar for small screens. */
export function MobileNav({ savedCount = 0 }) {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary navigation"
    >
      <ul className="hide-scrollbar flex items-stretch justify-between overflow-x-auto px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-w-[3.75rem] flex-col items-center gap-0.5 px-1 py-2.5 text-[9px] font-bold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  active ? 'text-primary' : 'text-on-surface-variant'
                )}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.href === '/saved' && savedCount > 0 ? (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-rose-signal px-1 text-[8px] font-black text-white">
                      {savedCount > 9 ? '9+' : savedCount}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.short}</span>
                {active ? (
                  <span
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileNav;
