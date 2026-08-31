'use client';

import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, LogOut, Bookmark, Gauge, ShieldCheck, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function UserMenu({ user, isAdmin }) {
  if (!user) {
    return (
      <Button size="sm" variant="primary" onClick={() => signIn()}>
        <LogIn />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-low pl-1 pr-2.5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Account menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-7 w-7 rounded-md object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-black text-on-primary">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[7rem] truncate text-[11px] font-bold text-on-surface sm:block">
          {user.name || user.email}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-xs font-bold normal-case tracking-normal text-on-surface">
            {user.name || 'Signed in'}
          </span>
          {user.email ? (
            <span className="mt-0.5 block truncate text-[10px] font-normal normal-case tracking-normal text-on-surface-variant">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>

        {isAdmin ? (
          <div className="px-2.5 pb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
              <ShieldCheck className="h-2.5 w-2.5" />
              Admin
            </span>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCircle />
            Your profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/saved">
            <Bookmark />
            Saved watchlist
          </Link>
        </DropdownMenuItem>

        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Gauge />
              Admin control
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: '/radar' })}
          className="text-rose-signal focus:text-rose-signal"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
