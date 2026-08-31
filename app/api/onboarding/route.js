import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, city, verticals, skills, capital, regulatory, onboardingComplete } = body;

    const profileData = {
      userId: user.id,
      role: role || 'aspiring',
      city: city || 'bangalore',
      verticals: Array.isArray(verticals) ? verticals : [],
      skills: Array.isArray(skills) ? skills : [],
      capital: capital || 'bootstrapped',
      regulatory: regulatory || 'moderate',
      onboardingComplete: Boolean(onboardingComplete),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.upsertProfile(user.id, profileData);

    return NextResponse.json({ ok: true, profile: saved });
  } catch (error) {
    console.error('[api/onboarding] failed to save profile:', error);
    return NextResponse.json({ error: { message: error.message || 'Failed to save profile' } }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
  }

  try {
    const profile = await repo.getProfile(user.id);
    return NextResponse.json({ ok: true, profile: profile || null });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
