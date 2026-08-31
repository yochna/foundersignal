import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { OnboardingClient } from './onboarding-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set Up Your Founder Profile',
  description: 'Tell FounderSignal about your background so we can surface the most relevant opportunities for you.',
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=/onboarding');

  // If profile already complete, skip onboarding
  let profile = null;
  try {
    profile = await repo.getProfile(user.id);
  } catch {
    // Fresh user — profile doesn't exist yet
  }

  if (profile?.onboardingComplete) {
    redirect('/radar');
  }

  return (
    <OnboardingClient
      userId={user.id}
      userName={user.name || user.email?.split('@')[0] || 'Founder'}
      existingProfile={profile}
    />
  );
}
