import { z } from 'zod';
import { clampScore, toArray } from '@/lib/utils';
import { MOMENTUM_VALUES, VERTICALS } from '@/lib/verticals';

/**
 * Normalisation layer between untrusted sources (LLM output, DB rows, request
 * bodies) and the UI.
 *
 * The rule everywhere: coerce and default rather than reject. A model that
 * omits `risks` should not blank the detail page, so every optional collection
 * falls back to an empty array and every score is clamped into 0-100.
 */

export { VERTICALS };

const MOMENTUM = MOMENTUM_VALUES;
const VOLUME = ['High', 'Medium', 'Low'];
const SCARCITY = ['Critical', 'High', 'Medium'];
const STRENGTH = ['Strong', 'Emerging', 'Medium', 'Weak'];

const looseString = (fallback = '') =>
  z.preprocess((v) => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return fallback;
  }, z.string());

const score = z.preprocess((v) => clampScore(v), z.number().min(0).max(100));

const enumish = (values, fallback) =>
  z.preprocess((v) => {
    if (typeof v !== 'string') return fallback;
    const match = values.find((allowed) => allowed.toLowerCase() === v.trim().toLowerCase());
    return match || fallback;
  }, z.enum(values));

/**
 * A list of objects that tolerates a list of strings.
 *
 * Models regularly flatten an array of objects into an array of names
 * (`"competitors": ["Perfios", "Karza"]` instead of `[{name, note}]`). Rejecting
 * that throws away an otherwise good analysis and drops the user to the
 * heuristic tier, so a bare string is promoted into the object's primary field
 * and the remaining fields take their defaults.
 */
const objectList = (schema, primaryKey) =>
  z.preprocess(
    (v) =>
      toArray(v)
        .filter((item) => item !== null && item !== undefined)
        .map((item) => {
          if (typeof item === 'object' && !Array.isArray(item)) return item;
          if (typeof item === 'string' || typeof item === 'number') {
            return { [primaryKey]: String(item) };
          }
          return {};
        }),
    z.array(schema)
  );

const stringList = z.preprocess(
  (v) =>
    toArray(v)
      .map((item) => (typeof item === 'string' ? item : item?.text || item?.name || ''))
      .filter((s) => typeof s === 'string' && s.trim().length > 0),
  z.array(z.string())
);

export const scoresSchema = z
  .preprocess(
    (v) => (v && typeof v === 'object' ? v : {}),
    z.object({
      demand: score.default(0),
      hiring: score.default(0),
      regulation: score.default(0),
      skills: score.default(0),
      competition: score.default(0),
      timing: score.default(0),
      indiaRelevance: score.default(0),
    })
  )
  .default({});

export const opportunitySchema = z.object({
  id: looseString(''),
  clusterId: looseString('').optional().default(''),
  title: looseString('Untitled opportunity'),
  problem: looseString(''),
  targetCustomer: looseString(''),
  industry: looseString('Unclassified'),
  vertical: enumish(VERTICALS, 'IT'),
  score: score.default(0),
  scores: scoresSchema,
  momentum: enumish(MOMENTUM, 'steady'),
  changePercentage: z.preprocess((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(-100, Math.min(999, Math.round(n))) : 0;
  }, z.number()),
  signalCount: z.preprocess((v) => Math.max(0, Math.round(Number(v) || 0)), z.number()),
  sourceCount: z.preprocess((v) => Math.max(0, Math.round(Number(v) || 0)), z.number()),
  whyInteresting: looseString(''),
  overview: looseString(''),
  whyMatters: looseString(''),
  demandAnalysis: looseString(''),
  signalsTimeline: objectList(
    z.object({
      date: looseString(''),
      value: z.preprocess((v) => Math.max(0, Math.round(Number(v) || 0)), z.number()),
    }),
    'date'
  ).default([]),
  hiringSignals: objectList(
    z.object({
      role: looseString('Unspecified role'),
      volume: enumish(VOLUME, 'Medium'),
      salaryRange: looseString('Not disclosed'),
      count: z.preprocess((v) => Math.max(0, Math.round(Number(v) || 0)), z.number()),
    }),
    'role'
  ).default([]),
  skillSignals: objectList(
    z.object({
      skill: looseString('Unspecified skill'),
      scarcity: enumish(SCARCITY, 'Medium'),
      impact: looseString(''),
    }),
    'skill'
  ).default([]),
  regulatorySignals: objectList(
    z.object({
      regulationName: looseString(''),
      agency: looseString(''),
      summary: looseString(''),
      date: looseString(''),
    }),
    'regulationName'
  ).default([]),
  technologySignals: objectList(
    z.object({
      tech: looseString(''),
      adoptionRate: looseString('Emerging'),
      description: looseString(''),
    }),
    'tech'
  ).default([]),
  competitionList: objectList(
    z.object({
      name: looseString(''),
      category: looseString(''),
      strength: enumish(STRENGTH, 'Medium'),
      pricing: looseString('Not disclosed'),
    }),
    'name'
  ).default([]),
  marketGap: looseString(''),
  mvpRecommendation: looseString(''),
  monetizationHypothesis: looseString(''),
  risks: stringList.default([]),
  indiaRelevanceText: looseString(''),
  relatedOpportunities: stringList.default([]),
  verdictMatrix: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        convictionLevel: looseString('High Conviction'),
        executionDifficulty: looseString('Medium'),
        capitalIntensity: looseString('Low to Moderate'),
        timeToRevenueMonths: looseString('3 - 6 Months'),
        overallRecommendation: looseString(''),
      })
    )
    .default({}),
  tamAnalysis: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        tamIndia: looseString(''),
        tamGlobal: looseString(''),
        sam: looseString(''),
        som: looseString(''),
        cagr: looseString(''),
        metricsBreakdown: looseString(''),
      })
    )
    .default({}),
  unitEconomics: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        arpu: looseString(''),
        cac: looseString(''),
        ltv: looseString(''),
        ltvCacRatio: looseString(''),
        paybackMonths: looseString(''),
        grossMargin: looseString(''),
        targetPricingTiers: objectList(
          z.object({
            tierName: looseString(''),
            price: looseString(''),
            billingCycle: looseString('monthly'),
            targetSegment: looseString(''),
            keyFeatures: stringList.default([]),
          }),
          'tierName'
        ).default([]),
      })
    )
    .default({}),
  technicalRoadmap: objectList(
    z.object({
      phase: looseString(''),
      duration: looseString(''),
      deliverables: stringList.default([]),
      techStack: stringList.default([]),
    }),
    'phase'
  ).default([]),
  buyerPersona: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        primaryBuyer: looseString(''),
        champions: looseString(''),
        gatekeepers: looseString(''),
        budgetCycle: looseString(''),
        purchaseTriggers: stringList.default([]),
        mustHaveChecklist: stringList.default([]),
      })
    )
    .default({}),
  gtmPlaybook: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        firstTenCustomersChannel: looseString(''),
        coldPitchAngle: looseString(''),
        earlyAdopterIncentive: looseString(''),
        distributionMoat: looseString(''),
      })
    )
    .default({}),
  incumbentTeardown: objectList(
    z.object({
      name: looseString(''),
      weakness: looseString(''),
      whyCannotPivot: looseString(''),
      defensibilityStrategy: looseString(''),
    }),
    'name'
  ).default([]),
  feeds: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        reddit: stringList.default([]),
        github: stringList.default([]),
        linkedin: stringList.default([]),
      })
    )
    .default({}),
  lastUpdated: looseString(''),
  source: enumish(['seed', 'ingested', 'live', 'cached', 'fallback'], 'ingested'),
});

/**
 * Parse an opportunity from any source. Returns null only when the record has
 * no usable identity or title, which is the one thing we cannot invent.
 */
export function normalizeOpportunity(raw, { fallbackId } = {}) {
  const parsed = opportunitySchema.safeParse(raw);
  if (!parsed.success) return null;

  const data = parsed.data;
  const id = data.id?.trim() || fallbackId || '';
  if (!id || !data.title?.trim()) return null;

  // Overall score is recomputed when the model forgot it, using the same
  // weighting the ingestion prompt describes.
  const overall =
    data.score > 0
      ? data.score
      : clampScore(
          data.scores.demand * 0.25 +
            data.scores.timing * 0.2 +
            data.scores.indiaRelevance * 0.2 +
            data.scores.hiring * 0.15 +
            data.scores.regulation * 0.1 +
            data.scores.competition * 0.1
        );

  return {
    ...data,
    id,
    clusterId: data.clusterId || id,
    score: overall,
    lastUpdated: data.lastUpdated || new Date().toISOString().slice(0, 10),
  };
}

// --- AI feature payloads -----------------------------------------------------

export const validationResultSchema = z.object({
  validationScore: score.default(0),
  verdict: looseString(''),
  scores: z
    .preprocess(
      (v) => (v && typeof v === 'object' ? v : {}),
      z.object({
        demand: score.default(0),
        competition: score.default(0),
        feasibility: score.default(0),
        timing: score.default(0),
        indiaRelevance: score.default(0),
        regulation: score.default(0),
      })
    )
    .default({}),
  summary: looseString(''),
  gaps: stringList.default([]),
  competitors: objectList(
    z.object({
      name: looseString(''),
      note: looseString(''),
    }),
    'name'
  ).default([]),
  mvpBuild: looseString(''),
  monetization: looseString(''),
  risks: stringList.default([]),
  nextSteps: stringList.default([]),
  relatedOpportunityIds: stringList.default([]),
});

export const matchResultSchema = z.object({
  matches: objectList(
    z.object({
      opportunityId: looseString(''),
      fitScore: score.default(0),
      rationale: looseString(''),
      complexity: enumish(['Low', 'Medium', 'High'], 'Medium'),
      mvpEffort: looseString('4-6 weeks'),
      firstStep: looseString(''),
      watchOut: looseString(''),
    }),
    'opportunityId'
  ).default([]),
  profileSummary: looseString(''),
});

export const resumeResultSchema = z.object({
  name: looseString(''),
  currentRole: looseString(''),
  seniority: looseString(''),
  skills: stringList.default([]),
  demandScore: score.default(0),
  summary: looseString(''),
  recommendations: objectList(
    z.object({
      skill: looseString(''),
      impactScore: z.preprocess(
        (v) => Math.max(0, Math.min(30, Math.round(Number(v) || 0))),
        z.number()
      ),
      difficulty: enumish(['Low', 'Medium', 'High'], 'Medium'),
      roleImpacted: looseString(''),
      why: looseString(''),
    }),
    'skill'
  ).default([]),
  adjacentPaths: objectList(
    z.object({
      role: looseString(''),
      salaryJump: looseString(''),
      demandIndex: score.default(0),
      bridgeSkill: looseString(''),
    }),
    'role'
  ).default([]),
  matchedOpportunityIds: stringList.default([]),
});

export const chatResultSchema = z.object({
  answer: looseString(''),
  citedOpportunityIds: stringList.default([]),
  followUps: stringList.default([]),
  disclaimer: looseString(''),
});

export const ROADMAP_KINDS = ['role', 'idea', 'startup'];
export const ROADMAP_HORIZONS = ['30 days', '90 days', '6 months', '12 months'];

export const roadmapResultSchema = z.object({
  title: looseString(''),
  summary: looseString(''),
  northStar: looseString(''),
  readinessScore: score.default(0),
  phases: objectList(
    z.object({
      name: looseString('Phase'),
      timeframe: looseString(''),
      objective: looseString(''),
      tasks: stringList.default([]),
      deliverable: looseString(''),
      successMetric: looseString(''),
      effort: enumish(['Low', 'Medium', 'High'], 'Medium'),
    }),
    'name'
  ).default([]),
  skillsToLearn: objectList(
    z.object({
      skill: looseString(''),
      why: looseString(''),
      resource: looseString(''),
    }),
    'skill'
  ).default([]),
  milestones: objectList(
    z.object({
      label: looseString(''),
      when: looseString(''),
      proof: looseString(''),
    }),
    'label'
  ).default([]),
  quickWins: stringList.default([]),
  risks: stringList.default([]),
  relatedOpportunityIds: stringList.default([]),
});

// --- Request bodies ----------------------------------------------------------

export const validateIdeaRequest = z.object({
  idea: z
    .string({ required_error: 'Describe your idea' })
    .trim()
    .min(12, 'Describe the idea in at least 12 characters so it can be scored')
    .max(2000, 'Keep the idea under 2000 characters'),
});

export const builderMatchRequest = z.object({
  answers: z
    .record(z.string(), z.string())
    .refine((v) => Object.keys(v).length >= 1, 'Answer at least one question'),
});

export const careerSignalRequest = z.object({
  resumeText: z
    .string()
    .trim()
    .min(40, 'Paste at least 40 characters of resume text')
    .max(20000, 'Resume text is too long; paste the most relevant sections'),
  fileName: z.string().trim().max(200).optional().default('pasted-resume.txt'),
});

export const chatRequest = z.object({
  message: z
    .string({ required_error: 'Type a question' })
    .trim()
    .min(2, 'Type a question')
    .max(1000, 'Keep questions under 1000 characters'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

export const saveOpportunityRequest = z.object({
  opportunityId: z.string().trim().min(1, 'Opportunity id is required').max(120),
});

export const createOrderRequest = z.object({
  plan: z.enum(['starter', 'venture_pro'], { required_error: 'plan is required' }),
});

export const verifyPaymentRequest = z.object({
  orderId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
  signature: z.string().trim().min(1),
});

export const roadmapRequest = z.object({
  goal: z
    .string({ required_error: 'Describe the role, idea or startup' })
    .trim()
    .min(12, 'Describe it in at least 12 characters so a plan can be built')
    .max(2000, 'Keep it under 2000 characters'),
  kind: z.enum(ROADMAP_KINDS).optional().default('idea'),
  horizon: z.enum(ROADMAP_HORIZONS).optional().default('90 days'),
  experience: z.string().trim().max(300).optional().default(''),
  hoursPerWeek: z.preprocess(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(120, Math.round(n))) : 10;
    },
    z.number()
  ),
});

// --- Profile -----------------------------------------------------------------

export const BUILDER_STAGES = ['exploring', 'validating', 'building', 'launched', 'scaling'];
export const PROFILE_VISIBILITY = ['public', 'private'];

/** A URL field that accepts an empty string, and tolerates a missing scheme. */
const optionalUrl = z.preprocess(
  (v) => {
    const raw = String(v ?? '').trim();
    if (!raw) return '';
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  },
  z.string().max(300).refine((v) => v === '' || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), {
    message: 'Enter a valid URL',
  })
);

const tagList = z.preprocess(
  (v) => {
    const items = Array.isArray(v)
      ? v
      : String(v ?? '')
          .split(',')
          .map((s) => s.trim());
    return Array.from(
      new Set(items.map((s) => String(s).trim()).filter(Boolean).map((s) => s.slice(0, 40)))
    ).slice(0, 20);
  },
  z.array(z.string())
);

export const profileUpdateRequest = z.object({
  displayName: z.string().trim().max(80).optional().default(''),
  headline: z.string().trim().max(140).optional().default(''),
  bio: z.string().trim().max(1200).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  roleTitle: z.string().trim().max(120).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  experienceYears: z.preprocess(
    (v) => Math.max(0, Math.min(60, Math.round(Number(v) || 0))),
    z.number()
  ),
  builderStage: z.enum(BUILDER_STAGES).optional().default('exploring'),
  weeklyHours: z.preprocess(
    (v) => Math.max(0, Math.min(120, Math.round(Number(v) || 0))),
    z.number()
  ),
  skills: tagList.optional().default([]),
  interests: tagList.optional().default([]),
  verticals: tagList.optional().default([]),
  lookingFor: z.string().trim().max(300).optional().default(''),
  websiteUrl: optionalUrl.optional().default(''),
  githubUrl: optionalUrl.optional().default(''),
  linkedinUrl: optionalUrl.optional().default(''),
  twitterUrl: optionalUrl.optional().default(''),
  visibility: z.enum(PROFILE_VISIBILITY).optional().default('public'),
});

// --- Community ---------------------------------------------------------------

export const COMMUNITY_TOPICS = [
  'general',
  'idea-feedback',
  'co-founder',
  'tech',
  'regulation',
  'fundraising',
  'launch',
  'hiring',
];

export const createPostRequest = z.object({
  title: z
    .string({ required_error: 'Give the discussion a title' })
    .trim()
    .min(6, 'Titles need at least 6 characters')
    .max(160, 'Keep the title under 160 characters'),
  body: z.string().trim().max(8000, 'Keep the post under 8000 characters').optional().default(''),
  topic: z.enum(COMMUNITY_TOPICS).optional().default('general'),
  tags: tagList.optional().default([]),
  linkUrl: optionalUrl.optional().default(''),
  opportunityId: z.string().trim().max(120).optional().default(''),
});

export const createCommentRequest = z.object({
  body: z
    .string({ required_error: 'Write a reply' })
    .trim()
    .min(2, 'Replies need at least 2 characters')
    .max(4000, 'Keep replies under 4000 characters'),
  parentId: z.string().trim().max(80).optional().default(''),
});

export const voteRequest = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().trim().min(1, 'A target id is required').max(80),
  // 0 clears an existing vote, which is what clicking the same arrow twice does.
  value: z.preprocess((v) => {
    const n = Number(v);
    return n > 0 ? 1 : n < 0 ? -1 : 0;
  }, z.number()),
});
