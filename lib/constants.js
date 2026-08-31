/**
 * Client-safe constants.
 *
 * Anything a client component needs from the "opportunities" domain lives here
 * rather than in lib/opportunities.js, because that module reaches into the data
 * layer (node:fs) and must never be pulled into a browser bundle.
 */

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended for you' },
  { value: 'score', label: 'Signal score' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'demand', label: 'Demand' },
  { value: 'regulation', label: 'Regulatory pressure' },
  { value: 'recent', label: 'Recently updated' },
];

export const MOMENTUM_OPTIONS = [
  { value: 'all', label: 'Any momentum' },
  { value: 'rising', label: 'Rising' },
  { value: 'steady', label: 'Steady' },
  { value: 'declining', label: 'Declining' },
];

/** Weighting used to recompute an overall score when a source omits one. */
export const SCORE_WEIGHTS = {
  demand: 0.25,
  timing: 0.2,
  indiaRelevance: 0.2,
  hiring: 0.15,
  regulation: 0.1,
  competition: 0.1,
};

/** Human labels for the seven score dimensions, used by charts and legends. */
export const SCORE_DIMENSIONS = [
  { key: 'demand', label: 'Demand', hint: 'Volume and intensity of people describing this problem.' },
  { key: 'hiring', label: 'Hiring', hint: 'Companies paying to solve it internally right now.' },
  { key: 'regulation', label: 'Regulation', hint: 'Regulatory pressure forcing a purchase decision.' },
  { key: 'skills', label: 'Skills scarcity', hint: 'How hard the required expertise is to hire.' },
  { key: 'competition', label: 'Competition gap', hint: 'Higher means incumbents leave more room.' },
  { key: 'timing', label: 'Timing', hint: 'Whether the window is open now rather than later.' },
  { key: 'indiaRelevance', label: 'India relevance', hint: 'How India-specific the problem and buyer are.' },
];

export const FEATURE_LABELS = {
  'idea-validator': 'Idea Validator',
  'builder-match': 'Builder Match',
  'career-signal': 'Career Signal',
  chat: 'AI Copilot',
  ingest: 'Ingestion',
};
