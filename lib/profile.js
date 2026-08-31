import { repo } from '@/lib/db';

/**
 * Profile assembly.
 *
 * A profile is two things stitched together: the identity row mirrored from the
 * auth provider (not editable here) and the user-authored profile row. Around
 * them sits a read-only activity summary drawn from the feature tables, which
 * is what makes the page worth visiting rather than just a settings form.
 *
 * Every stat is fetched defensively: a single unavailable table should degrade
 * one number, not blank the page.
 */

export const EMPTY_PROFILE = {
  displayName: '',
  headline: '',
  bio: '',
  location: '',
  roleTitle: '',
  company: '',
  experienceYears: 0,
  builderStage: 'exploring',
  weeklyHours: 0,
  skills: [],
  interests: [],
  verticals: [],
  lookingFor: '',
  websiteUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  visibility: 'public',
};

export const STAGE_LABELS = {
  exploring: 'Exploring ideas',
  validating: 'Validating',
  building: 'Building',
  launched: 'Launched',
  scaling: 'Scaling',
};

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

async function collectStats(userId) {
  const [saved, validations, roadmaps, resume, quiz] = await Promise.all([
    safe(repo.listSaved(userId), []),
    safe(repo.listValidations(userId, 50), []),
    safe(repo.listRoadmaps(userId, 50), []),
    safe(repo.latestResumeProfile(userId), null),
    safe(repo.latestQuizResult(userId), null),
  ]);

  const topValidation = validations.reduce(
    (best, row) => (row.validationScore > (best?.validationScore ?? -1) ? row : best),
    null
  );

  const topMatch = quiz?.results?.matches?.[0] || null;

  return {
    savedCount: saved.length,
    validationCount: validations.length,
    roadmapCount: roadmaps.length,
    demandScore: resume?.demandScore ?? null,
    demandScoreAt: resume?.createdAt || null,
    resumeRole: resume?.parsed?.currentRole || '',
    resumeSkills: resume?.parsed?.skills || [],
    bestValidationScore: topValidation?.validationScore ?? null,
    bestValidationIdea: topValidation?.ideaText || '',
    topMatchTitle: topMatch?.opportunityId || '',
    topMatchScore: topMatch?.fitScore ?? null,
    lastValidationAt: validations[0]?.createdAt || null,
    lastRoadmapAt: roadmaps[0]?.createdAt || null,
  };
}

/**
 * @param {string} userId  whose profile to load
 * @param {object} options
 * @param {string|null} options.viewerId  who is asking; enables edit and
 *   bypasses the private setting when it matches userId
 */
export async function loadProfileBundle(userId, { viewerId = null } = {}) {
  const [users, profile] = await Promise.all([
    safe(repo.listUsersByIds([userId]), []),
    safe(repo.getProfile(userId), null),
  ]);

  const user = users?.[0] || null;
  const isOwner = Boolean(viewerId && viewerId === userId);

  // A user who has never opened this page has no profile row, and neither does
  // one who signed in while the database was unreachable. Both should see the
  // empty form rather than a not-found.
  if (!user && !profile && !isOwner) return null;

  const visible = isOwner || (profile?.visibility ?? 'public') === 'public';
  const stats = visible ? await collectStats(userId) : null;

  return {
    userId,
    isOwner,
    visible,
    identity: {
      name: user?.name || '',
      email: user?.email || '',
      image: user?.image || null,
      memberSince: user?.createdAt || null,
    },
    profile: { ...EMPTY_PROFILE, ...(profile || {}) },
    stats,
  };
}
