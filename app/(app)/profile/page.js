import { redirect } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { ProfileClient } from '@/app/(app)/profile/profile-client';
import { getSession } from '@/lib/auth';
import { loadProfileBundle } from '@/lib/profile';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your Profile',
  description: 'Everything FounderSignal knows about you, what other members can see, and your activity across the app.',
};

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;

  // Middleware already guards this route; this keeps the page honest if the
  // matcher is ever changed.
  if (!user?.id) redirect('/login?callbackUrl=/profile');

  const bundle = await loadProfileBundle(user.id, { viewerId: user.id });

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your Profile"
        icon={UserCircle}
        description="What you put here shapes the roadmaps and matches you get, and it is the byline other members see on your posts. Everything except your sign-in identity is editable."
      />
      <ProfileClient
        bundle={bundle}
        sessionUser={{
          name: user.name || '',
          email: user.email || '',
          image: user.image || null,
          provider: user.provider || 'demo',
        }}
        isAdmin={Boolean(session?.isAdmin)}
      />
    </>
  );
}
