'use client';

import * as React from 'react';
import { Share2, FileDown, Copy, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSubscription } from '@/context/subscription-context';

/**
 * Social share + PDF export + copy-link toolbar for the opportunity detail page.
 *
 * Share buttons open the native share sheet on mobile and the LinkedIn/Twitter
 * intent URLs on desktop (since those don't have a share target parameter).
 * PDF export opens a print-friendly view. Copy-link writes the canonical URL
 * to the clipboard and confirms with a toast.
 */
export function ShareToolbar({ opportunity }) {
  const { isPro } = useSubscription();
  const url = typeof window !== 'undefined' ? window.location.href : `https://foundersignal.in/opportunities/${opportunity.id}`;
  const title = encodeURIComponent(`${opportunity.title} — FounderSignal`);
  const text = encodeURIComponent(`Analyzing "${opportunity.title}" — a signal score of ${opportunity.score}/100 in ${opportunity.vertical}.`);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled share — silently ignore
      }
    } else {
      // Fall back to copy link
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', { description: 'Paste it into your social post or newsletter.' });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied', { description: 'The opportunity URL is in your clipboard.' });
  };

  const handleExportPdf = () => {
    if (!isPro) {
      // Will be caught by the parent's handler, but keep as a guard
      toast.info('Pro required', { description: 'Export to PDF is available for Pro members.' });
      return;
    }
    // Open print-friendly view in a new tab
    const printUrl = `/opportunities/${opportunity.id}/print`;
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1.5" />
        Share
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopyLink}>
        <Copy className="h-4 w-4 mr-1.5" />
        Copy link
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=600,height=600')}
      >
        <Linkedin className="h-4 w-4 mr-1.5" />
        LinkedIn
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=600,height=450')}
      >
        <Twitter className="h-4 w-4 mr-1.5" />
        Twitter
      </Button>
      {isPro ? (
        <Button variant="secondary" size="sm" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4 mr-1.5" />
          Export PDF
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4 mr-1.5" />
          Export PDF <span className="ml-1">(Pro)</span>
        </Button>
      )}
    </div>
  );
}

export default ShareToolbar;