import { MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { ChatClient } from '@/app/(app)/chat/chat-client';
import { getQuotaState } from '@/lib/ai/gateway';
import { requireUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Copilot',
  description:
    'Ask questions about the opportunity feed and get answers grounded in the briefs, with the sources it used.',
};

export default async function ChatPage() {
  // Middleware already guards this route; requireUser makes the dependency
  // explicit and gives the same 401 semantics if middleware is ever relaxed.
  const user = await requireUser();
  const quota = await getQuotaState('chat', user.id);

  let history = [];
  try {
    history = (await repo.listChat(user.id, 40)).map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('[chat] history lookup failed:', error.message);
  }

  return (
    <>
      <PageHeader
        eyebrow="Interrogate"
        title="Copilot"
        icon={MessagesSquare}
        description="Grounded in the opportunity briefs rather than the open internet. Every answer lists the briefs it drew from, so you can check the claim yourself."
      />
      <ChatClient initialQuota={quota} initialHistory={history} />
    </>
  );
}
