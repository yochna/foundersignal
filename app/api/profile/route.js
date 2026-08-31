import { withApi, readJson, parseWith } from '@/lib/api';
import { profileUpdateRequest } from '@/lib/schemas';
import { requireUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** GET /api/profile — the signed-in user's own editable profile. */
export const GET = withApi(async () => {
  const user = await requireUser();
  const profile = await repo.getProfile(user.id);
  return { profile: profile || null };
});

/**
 * PUT /api/profile
 * Replaces the editable fields. Identity fields (email, provider, avatar) come
 * from the auth provider and are deliberately not writable here.
 */
export const PUT = withApi(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const patch = parseWith(profileUpdateRequest, body);

  // Keep public.users in step so the forum shows a name even for a user whose
  // row predates this table.
  try {
    await repo.upsertUser({
      id: user.id,
      email: user.email,
      name: patch.displayName || user.name,
      image: user.image,
    });
  } catch (error) {
    console.error('[profile] could not refresh user record:', error.message);
  }

  const profile = await repo.upsertProfile(user.id, patch);
  return { profile };
});
