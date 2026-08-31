'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Loader2, Radar as RadarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NAV_ITEMS } from '@/lib/nav';
import { api } from '@/lib/fetcher';
import { cn, scoreBand } from '@/lib/utils';

/**
 * Ctrl/Cmd+K palette. Navigation entries are matched locally; opportunity
 * results are fetched from the API with a debounce, and a failed search simply
 * yields no opportunity rows rather than an error, since navigation must keep
 * working regardless.
 */
export function CommandPalette({ open, onOpenChange, isAdmin }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [opportunities, setOpportunities] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef(null);

  const navMatches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = NAV_ITEMS.filter((item) => !item.requiresAdmin || isAdmin);
    if (!q) return pool;
    return pool.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query, isAdmin]);

  // Debounced opportunity search.
  React.useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setOpportunities([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const result = await api.get(
        `/api/opportunities?q=${encodeURIComponent(q)}&limit=6&fields=compact`,
        { signal: controller.signal, timeoutMs: 8000 }
      );
      if (!controller.signal.aborted) {
        setOpportunities(result.ok ? result.data.opportunities || [] : []);
        setSearching(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const rows = React.useMemo(
    () => [
      ...navMatches.map((item) => ({ kind: 'nav', key: `nav:${item.href}`, item })),
      ...opportunities.map((opp) => ({ kind: 'opportunity', key: `opp:${opp.id}`, item: opp })),
    ],
    [navMatches, opportunities]
  );

  React.useEffect(() => setActiveIndex(0), [query]);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setOpportunities([]);
      setActiveIndex(0);
    }
  }, [open]);

  const go = React.useCallback(
    (row) => {
      if (!row) return;
      onOpenChange(false);
      router.push(row.kind === 'nav' ? row.item.href : `/opportunities/${row.item.id}`);
    },
    [onOpenChange, router]
  );

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(rows[activeIndex]);
    }
  }

  // Keep the highlighted row inside the scroll viewport.
  React.useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let cursor = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 p-0" hideClose>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search opportunities and jump to any tool
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search opportunities or jump to a tool…"
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
          />
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-on-surface-variant" />
          ) : (
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant sm:block">
              ESC
            </kbd>
          )}
        </div>

        <div
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          className="hide-scrollbar max-h-[52vh] overflow-y-auto p-2"
        >
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-on-surface-variant">
              {searching ? 'Searching…' : `No matches for "${query}".`}
            </p>
          ) : null}

          {navMatches.length > 0 ? (
            <p className="px-3 pb-1 pt-2 text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant/55">
              Go to
            </p>
          ) : null}
          {navMatches.map((item) => {
            cursor += 1;
            const index = cursor;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go({ kind: 'nav', item })}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  index === activeIndex ? 'bg-surface-low' : 'hover:bg-surface-low/60'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-on-surface">{item.label}</span>
                  <span className="block truncate text-[10px] text-on-surface-variant">
                    {item.description}
                  </span>
                </span>
                {index === activeIndex ? (
                  <CornerDownLeft className="h-3 w-3 shrink-0 text-on-surface-variant" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}

          {opportunities.length > 0 ? (
            <p className="px-3 pb-1 pt-3 text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant/55">
              Opportunities
            </p>
          ) : null}
          {opportunities.map((opp) => {
            cursor += 1;
            const index = cursor;
            const band = scoreBand(opp.score);
            return (
              <button
                key={opp.id}
                type="button"
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go({ kind: 'opportunity', item: opp })}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  index === activeIndex ? 'bg-surface-low' : 'hover:bg-surface-low/60'
                )}
              >
                <RadarIcon className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-on-surface">{opp.title}</span>
                  <span className="block truncate text-[10px] text-on-surface-variant">
                    {opp.industry}
                  </span>
                </span>
                <span className={cn('mono shrink-0 text-xs font-bold', band.text)}>{opp.score}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[10px] text-on-surface-variant">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border px-1 py-0.5 font-bold">??</kbd> navigate
            <kbd className="rounded border border-border px-1 py-0.5 font-bold">?</kbd> open
          </span>
          <span className="font-semibold">FounderSignal</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
