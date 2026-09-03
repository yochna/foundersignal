'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'fs_session_id';

/** Stable per-browser id for grouping anonymous activity, not a cookie and not PII. */
function sessionId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / storage disabled: activity still logs, just without
    // a stable session id to group repeat views by the same anonymous visitor.
    return null;
  }
}

/**
 * Fires a lightweight, best-effort page_view event on every route change.
 * This is what feeds the "User activity" panel in /admin — Vercel Web
 * Analytics already covers aggregate traffic, this covers attributable,
 * queryable events (who visited what, and when).
 *
 * Mounted once in components/providers.jsx. Never throws, never blocks
 * rendering, and skips /admin itself so the panel isn't logging views of
 * its own page.
 */
export function ActivityTracker() {
  const pathname = usePathname();
  const lastSent = useRef(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const payload = JSON.stringify({
      event: 'page_view',
      path: pathname,
      sessionId: sessionId(),
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Tracking is a nice-to-have; a blocked or failed beacon should never
      // surface to the visitor.
    }
  }, [pathname]);

  return null;
}

export default ActivityTracker;
