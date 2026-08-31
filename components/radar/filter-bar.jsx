'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VERTICALS } from '@/lib/verticals';
import { MOMENTUM_OPTIONS, SORT_OPTIONS } from '@/lib/constants';

/**
 * URL-driven filters. Keeping state in the query string means a filtered radar
 * is shareable and survives a refresh, and the server component re-renders with
 * the new results rather than us duplicating filter logic on the client.
 */
export function FilterBar({ total, returned }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [draft, setDraft] = React.useState(params.get('q') || '');
  const debounceRef = React.useRef(null);

  // Keep the box in sync when navigation changes the query externally.
  React.useEffect(() => {
    setDraft(params.get('q') || '');
  }, [params]);

  const push = React.useCallback(
    (updates) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all' || value === 'score') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  function onSearchChange(value) {
    setDraft(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q: value.trim() }), 350);
  }

  React.useEffect(() => () => clearTimeout(debounceRef.current), []);

  const vertical = params.get('vertical') || 'all';
  const momentum = params.get('momentum') || 'all';
  const sort = params.get('sort') || 'score';
  const hasFilters = Boolean(params.get('q') || vertical !== 'all' || momentum !== 'all' || sort !== 'score');

  return (
    <div className="mb-6">
      <div className="glass flex flex-col gap-3 rounded-xl p-3.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant"
            aria-hidden="true"
          />
          <Input
            value={draft}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems, sectors, skills, buyers"
            className="pl-9 pr-9"
            aria-label="Search opportunities"
          />
          {draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft('');
                clearTimeout(debounceRef.current);
                push({ q: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
          <Select
            value={vertical}
            onChange={(e) => push({ vertical: e.target.value })}
            aria-label="Filter by sector"
            className="lg:w-36"
          >
            <option value="all">All sectors</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>

          <Select
            value={momentum}
            onChange={(e) => push({ momentum: e.target.value })}
            aria-label="Filter by momentum"
            className="lg:w-36"
          >
            {MOMENTUM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(e) => push({ sort: e.target.value })}
            aria-label="Sort opportunities"
            className="col-span-2 sm:col-span-1 lg:w-44"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
          <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
          Showing <span className="mono font-bold text-on-surface">{returned}</span>
          {returned !== total ? (
            <>
              of <span className="mono font-bold text-on-surface">{total}</span>
            </>
          ) : null}{' '}
          {total === 1 ? 'opportunity' : 'opportunities'}
        </p>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft('');
              router.push(pathname, { scroll: false });
            }}
          >
            <X />
            Reset filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default FilterBar;
