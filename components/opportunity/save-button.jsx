'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

/**
 * Optimistic save toggle.
 *
 * Updates immediately, then reconciles with the server. Any failure reverts the
 * icon and explains why, so the UI never claims a save that did not persist.
 */
export function SaveButton({
  opportunityId,
  opportunityTitle,
  initialSaved = false,
  variant = 'icon',
  className,
  onChange,
}) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => setSaved(initialSaved), [initialSaved]);

  async function toggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (status !== 'authenticated') {
      toast.info('Sign in to build your watchlist', {
        description: 'Saved opportunities are tied to your account.',
        action: { label: 'Sign in', onClick: () => router.push('/login?callbackUrl=/radar') },
      });
      return;
    }

    const next = !saved;
    setSaved(next);
    setPending(true);
    onChange?.(next);

    const result = next
      ? await api.post('/api/opportunities/save', { opportunityId })
      : await api.del('/api/opportunities/save', { opportunityId });

    setPending(false);

    if (!result.ok) {
      setSaved(!next);
      onChange?.(!next);

      if (result.error?.code === 'UNAUTHORIZED') {
        toast.error('Your session expired', {
          description: 'Sign in again to save opportunities.',
          action: { label: 'Sign in', onClick: () => router.push('/login') },
        });
      } else if (result.error?.code === 'READ_ONLY') {
        toast.error('Storage is read-only', { description: result.error.hint });
      } else {
        toast.error(next ? 'Could not save' : 'Could not remove', {
          description: result.error?.message,
        });
      }
      return;
    }

    const label = opportunityTitle ? `"${opportunityTitle}"` : 'Opportunity';
    const caveat =
      result.data?.persistence === 'degraded'
        ? ' - saved locally while the database is unreachable.'
        : result.data?.persistence === 'ephemeral'
          ? ' - demo storage, cleared when the server restarts.'
          : '';

    if (next) {
      toast.success('Added to watchlist', {
        description: label + caveat,
        action: { label: 'View', onClick: () => router.push('/saved') },
      });
    } else {
      toast('Removed from watchlist', { description: label + caveat });
    }

    // Keeps the rail badge and /saved page in sync.
    router.refresh();
  }

  const Icon = saved ? BookmarkCheck : Bookmark;

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-bold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
          saved
            ? 'border-primary/30 bg-primary/12 text-primary'
            : 'border-border bg-surface-low text-on-surface-variant hover:border-primary/40 hover:text-on-surface',
          className
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {saved ? 'Saved to watchlist' : 'Save to watchlist'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
        saved
          ? 'border-primary/30 bg-primary/12 text-primary'
          : 'border-border bg-surface-low text-on-surface-variant hover:border-primary/40 hover:text-on-surface',
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default SaveButton;
