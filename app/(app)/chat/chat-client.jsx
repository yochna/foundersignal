'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Send,
  Trash2,
  Sparkles,
  User as UserIcon,
  Quote,
  CornerDownLeft,
  Loader2,
  MessagesSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/feedback/empty-state';
import { InlineError } from '@/components/feedback/error-panel';
import { AiMeta } from '@/components/feedback/ai-meta';
import { QuotaMeter } from '@/components/feedback/quota-meter';
import { api } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

const STARTERS = [
  'Which opportunity has the strongest regulatory tailwind right now?',
  'I can only commit ten hours a week. What should I build?',
  'Compare the two highest-scoring fintech opportunities.',
  'What is the fastest opportunity to a first paying customer?',
];

function Bubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-surface-high text-on-surface-variant' : 'bg-primary text-on-primary'
        )}
        aria-hidden="true"
      >
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </span>

      <div className={cn('min-w-0 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-xs leading-relaxed',
            isUser
              ? 'bg-surface-high text-on-surface'
              : 'border border-border bg-surface-low/70 text-on-surface-variant'
          )}
        >
          {message.content.split('\n').map((line, index) =>
            line.trim() ? (
              <p key={index} className={index > 0 ? 'mt-2' : undefined}>
                {line}
              </p>
            ) : null
          )}
        </div>

        {message.cited?.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Quote className="h-3 w-3 text-on-surface-variant/60" aria-hidden="true" />
            {message.cited.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Badge variant="outline" className="hover:border-primary/50 hover:text-primary">
                  {opportunity.title.length > 44
                    ? `${opportunity.title.slice(0, 44)}\u2026`
                    : opportunity.title}
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}

        {message.followUps?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => message.onFollowUp?.(followUp)}
                className="rounded-full border border-border bg-surface-low/60 px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {followUp}
              </button>
            ))}
          </div>
        ) : null}

        {message.disclaimer ? (
          <p className="mt-1.5 text-[10px] italic leading-relaxed text-on-surface-variant/60">
            {message.disclaimer}
          </p>
        ) : null}

        {message.meta ? <AiMeta meta={message.meta} className="mt-2" compact /> : null}
      </div>
    </div>
  );
}

export function ChatClient({ initialQuota, initialHistory }) {
  const [messages, setMessages] = React.useState(initialHistory || []);
  const [draft, setDraft] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [quota, setQuota] = React.useState(initialQuota);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const send = React.useCallback(
    async (raw) => {
      const message = String(raw || '').trim();
      if (!message || pending) return;

      setError(null);
      setDraft('');
      setPending(true);

      const optimistic = { id: `local-${Date.now()}`, role: 'user', content: message };
      // Send the trailing exchange only; the server re-grounds from the corpus,
      // so a long transcript adds tokens without adding accuracy.
      const historyForModel = messages
        .slice(-6)
        .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));

      setMessages((prev) => [...prev, optimistic]);

      const response = await api.post(
        '/api/chat',
        { message, history: historyForModel },
        { timeoutMs: 60_000 }
      );

      setPending(false);

      if (!response.ok) {
        setError(response.error);
        // Drop the optimistic turn so the transcript matches what the server has.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(message);
        toast.error('Could not answer that', { description: response.error?.message });
        return;
      }

      const { result, cited, meta } = response.data;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          cited,
          followUps: result.followUps,
          disclaimer: result.disclaimer,
          meta,
        },
      ]);

      if (meta?.quota) setQuota((q) => ({ ...q, ...meta.quota }));
      inputRef.current?.focus();
    },
    [messages, pending]
  );

  async function clear() {
    const snapshot = messages;
    setMessages([]);
    const response = await api.del('/api/chat');
    if (!response.ok) {
      setMessages(snapshot);
      toast.error('Could not clear the transcript', { description: response.error?.message });
      return;
    }
    toast.success('Transcript cleared');
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  // Follow-up chips need a handler, but only the newest answer should offer them.
  const rendered = messages.map((message, index) => ({
    ...message,
    followUps: index === messages.length - 1 ? message.followUps : undefined,
    onFollowUp: send,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <QuotaMeter quota={quota} />
        {messages.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 />
            Clear transcript
          </Button>
        ) : null}
      </div>

      <Card tone="glass" className="flex h-[min(70vh,640px)] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="Ask about anything in the feed"
              description="Answers are grounded in the opportunity briefs, so the Copilot will tell you when the feed does not cover something rather than inventing an answer."
              className="border-0 bg-transparent"
            >
              <div className="mt-4 flex flex-col gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    className="rounded-lg border border-border bg-surface-low/60 px-3.5 py-2.5 text-left text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </EmptyState>
          ) : (
            rendered.map((message) => <Bubble key={message.id} message={message} />)
          )}

          {pending ? (
            <div className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary"
                aria-hidden="true"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-low/70 px-3.5 py-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  Reading the briefs
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 bg-surface-low/40 p-3.5">
          {error ? <InlineError error={error} className="mb-2.5" /> : null}
          <div className="flex items-end gap-2.5">
            <Textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about an opportunity, a market or what to build first"
              aria-label="Message"
              className="max-h-32 min-h-[40px] resize-none py-2.5 font-normal"
            />
            <Button
              size="icon"
              onClick={() => send(draft)}
              disabled={!draft.trim() || pending}
              aria-label="Send message"
            >
              <Send />
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-on-surface-variant/70">
            <CornerDownLeft className="h-2.5 w-2.5" aria-hidden="true" />
            Enter to send, Shift+Enter for a new line
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ChatClient;
