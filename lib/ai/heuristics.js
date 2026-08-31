import { clampScore } from '@/lib/utils';

/**
 * Deterministic fallback tier.
 *
 * These run when Gemini is unconfigured, quota-blocked, or failing. They are the
 * keyword heuristics from the original MVP's AppContext, generalised into a
 * data-driven table and extended to consider the live opportunity corpus rather
 * than hardcoded constants.
 *
 * Everything here is pure and synchronous, so it cannot fail. Output is always
 * labelled `source: 'fallback'` by the gateway, never presented as model output.
 */

/**
 * Theme table. Each entry recognises a market and supplies the scoring profile
 * and advice a model would otherwise generate.
 */
const THEMES = [
  {
    key: 'regtech',
    keywords: ['compliance', 'rbi', 'sebi', 'regulatory', 'regtech', 'audit', 'kyc', 'aml', 'dpdp', 'circular', 'filing', 'xbrl'],
    bonus: 12,
    scores: { demand: 92, competition: 58, feasibility: 70, timing: 93, indiaRelevance: 98, regulation: 95 },
    gaps: [
      'Existing RegTech tools audit generic conversation quality but do not map findings to specific circular clauses.',
      'Regional-language compliance coverage (Hindi, Tamil, Telugu) is largely unserved.',
    ],
    competitors: [
      { name: 'Signzy', note: 'Strong on onboarding and KYC, thin on post-onboarding conduct auditing.' },
      { name: 'IRIS Business Services', note: 'Enterprise reporting incumbent; priced out of the mid-market.' },
      { name: 'ComplianceAI', note: 'Global RegTech with no Indian circular taxonomy.' },
    ],
    mvpBuild:
      'Ship a batch upload dashboard: the user drops in transcripts or filings, and the system returns violations mapped to the exact clause, with an exportable audit report.',
    monetization:
      'B2B SaaS priced per audited unit (minutes, filings, or agents), with an enterprise tier for on-premise deployment to satisfy data-residency rules.',
    risks: [
      'Data-residency rules in Indian financial services often force on-premise or sovereign-cloud deployment.',
      'Regulatory taxonomies change without much notice, making schema maintenance an ongoing cost.',
    ],
    nextSteps: [
      'Interview three compliance officers at mid-tier NBFCs about their current audit sampling rate.',
      'Pick one circular and build the clause-mapping logic end to end before broadening scope.',
      'Confirm whether the buyer needs on-premise deployment before choosing a cloud architecture.',
    ],
  },
  {
    key: 'payments-fraud',
    keywords: ['fraud', 'upi', 'payment', 'mule', 'merchant', 'chargeback', 'npci', 'settlement', 'gateway', 'transaction'],
    bonus: 9,
    scores: { demand: 88, competition: 70, feasibility: 68, timing: 89, indiaRelevance: 99, regulation: 84 },
    gaps: [
      'Global fraud engines do not model UPI-specific transaction speed profiles or the device mix common in semi-urban India.',
      'Indian tools concentrate on onboarding KYC rather than continuous post-onboarding telemetry.',
    ],
    competitors: [
      { name: 'Bureau.id', note: 'Strong identity verification, pay-per-check pricing.' },
      { name: 'Sift', note: 'Mature global engine, slow to support UPI-native flows.' },
    ],
    mvpBuild:
      'Build an SDK that scores a transaction in under 20ms from device health, geolocation stability and velocity rules, returning a risk band the gateway can act on.',
    monetization:
      'Per-API-call pricing with volume tiers, plus paid integration support for large aggregators.',
    risks: [
      'A sub-20ms latency budget leaves almost no headroom for network hops.',
      'False positives block genuine merchants, so precision matters more than recall.',
    ],
    nextSteps: [
      'Get a sample of labelled fraudulent and genuine transactions from one acquirer.',
      'Benchmark your scoring latency under realistic load before pitching a latency SLA.',
      'Confirm what telemetry you may lawfully retain under NPCI directives.',
    ],
  },
  {
    key: 'ai-infra',
    keywords: ['llm', 'devops', 'observability', 'cache', 'token', 'agent', 'prompt', 'inference', 'gpu', 'latency', 'mlops', 'rag'],
    bonus: 7,
    scores: { demand: 86, competition: 75, feasibility: 80, timing: 91, indiaRelevance: 82, regulation: 55 },
    gaps: [
      'Existing tools optimise sandbox debugging; production-grade budget enforcement per client is missing.',
      'No incumbent combines cost governance with prompt-injection screening on the same tool-call path.',
    ],
    competitors: [
      { name: 'LangSmith', note: 'Strong tracing, weak on hard spend enforcement.' },
      { name: 'Helicone', note: 'Gateway with usage metering; thinner policy layer.' },
    ],
    mvpBuild:
      'Ship a drop-in proxy SDK for Node and Python that yields token, latency and failover dashboards the moment it is installed, with a declarative per-project spend cap.',
    monetization:
      'Generous free request tier to drive adoption, then monthly pricing by request volume, with self-hosting for enterprises.',
    risks: [
      'An extra network hop adds latency you must justify to the buyer.',
      'Customers will require prompt hashing before any content is stored.',
    ],
    nextSteps: [
      'Instrument one real production app and measure how much spend the cap would actually have saved.',
      'Decide early whether you store prompt content, because it dictates your security posture.',
      'Target Indian services firms billing global clients; cost governance is a sales asset for them.',
    ],
  },
  {
    key: 'msme-finance',
    keywords: ['gst', 'invoice', 'msme', 'sme', 'credit', 'lending', 'working capital', 'reconciliation', 'underwriting', 'account aggregator', 'itc'],
    bonus: 8,
    scores: { demand: 87, competition: 66, feasibility: 74, timing: 90, indiaRelevance: 99, regulation: 88 },
    gaps: [
      'Incumbents reconcile or score but stop short of closing the loop that actually recovers cash.',
      'Bureau scores miss thin-file MSMEs entirely despite rich GST and UPI evidence being available.',
    ],
    competitors: [
      { name: 'ClearTax', note: 'Strong tax compliance suite, subscription per GSTIN.' },
      { name: 'Zoho Books', note: 'Bundled accounting module rather than a focused recovery tool.' },
    ],
    mvpBuild:
      'Let a user upload a purchase register, reconcile it against fetched GSTR-2B data, and fire one-click WhatsApp reminders at defaulting suppliers.',
    monetization:
      'Flat monthly fee per GSTIN for SMEs, with a success-fee option tied to recovered credit for larger accounts.',
    risks: [
      'Heavy dependence on GSTN API uptime and frequent schema changes.',
      'WhatsApp template approval adds friction to the outreach workflow.',
    ],
    nextSteps: [
      'Quantify trapped Input Tax Credit for five target firms; that rupee figure is your pitch.',
      'Validate GSTN sandbox access early, since it gates the whole product.',
      'Test whether CA firms are a channel or a competitor in your segment.',
    ],
  },
  {
    key: 'health',
    keywords: ['health', 'patient', 'clinic', 'diagnostic', 'abdm', 'telemedicine', 'hospital', 'medical', 'pharmacy'],
    bonus: 5,
    scores: { demand: 80, competition: 68, feasibility: 62, timing: 78, indiaRelevance: 88, regulation: 82 },
    gaps: [
      'ABDM-compliant interoperability is still poorly served for small and mid-sized clinics.',
      'Workflow tools rarely account for how Indian clinics actually operate at the front desk.',
    ],
    competitors: [{ name: 'Practo', note: 'Consumer-facing scale; clinic back-office remains fragmented.' }],
    mvpBuild:
      'Digitise one narrow, painful workflow for a single clinic type and prove time saved per day before broadening.',
    monetization: 'Per-clinic monthly subscription, with per-seat pricing above a threshold.',
    risks: [
      'Health data attracts strict consent and retention obligations.',
      'Clinical workflow change management is slow and reference-driven.',
    ],
    nextSteps: [
      'Sit in one clinic for a full day and time the workflow you intend to replace.',
      'Confirm ABDM requirements that apply to your data category before designing storage.',
    ],
  },
  {
    key: 'education',
    keywords: ['education', 'student', 'learning', 'edtech', 'exam', 'course', 'skilling', 'placement', 'tutor'],
    bonus: 4,
    scores: { demand: 76, competition: 55, feasibility: 76, timing: 72, indiaRelevance: 86, regulation: 50 },
    gaps: [
      'Outcome measurement, rather than content delivery, is where Indian EdTech is thinnest.',
      'B2B sales to institutions is under-tooled compared with direct-to-consumer.',
    ],
    competitors: [{ name: 'Established D2C EdTech platforms', note: 'Heavy on content, light on verified outcomes.' }],
    mvpBuild:
      'Instrument one measurable outcome (placement rate, exam delta) for a single institution and report it credibly.',
    monetization: 'Annual per-institution licence, priced against the outcome you improve.',
    risks: [
      'Institutional budget cycles are slow and politically mediated.',
      'Consumer EdTech trust has been damaged by aggressive prior sales practices.',
    ],
    nextSteps: [
      'Find one institution willing to share baseline outcome data.',
      'Define the metric you will be judged on before you build.',
    ],
  },
];

const DEFAULT_THEME = {
  key: 'general',
  bonus: 0,
  scores: { demand: 68, competition: 62, feasibility: 74, timing: 66, indiaRelevance: 70, regulation: 45 },
  gaps: [
    'No converging evidence identified yet. Establish demand from hiring posts, review sites or community complaints before building.',
  ],
  competitors: [{ name: 'Generic global SaaS alternatives', note: 'Likely adequate substitutes until you find a sharper wedge.' }],
  mvpBuild:
    'Build the smallest artefact that forces a yes-or-no answer from a real buyer: a landing page with a priced offer, or a manual concierge version delivered by hand.',
  monetization: 'Charge from the first customer. Pricing conversations surface the real value faster than usage data.',
  risks: [
    'The problem may be real but not painful enough to command a budget.',
    'Without a specific buyer, positioning stays vague and sales cycles stall.',
  ],
  nextSteps: [
    'Name the exact job title who would pay for this.',
    'Find ten instances of someone describing this problem in public.',
    'Write the one-sentence pitch and test whether it earns a second question.',
  ],
};

function detectTheme(text) {
  const haystack = String(text || '').toLowerCase();

  let best = null;
  let bestHits = 0;

  for (const theme of THEMES) {
    const hits = theme.keywords.filter((keyword) => haystack.includes(keyword)).length;
    if (hits > bestHits) {
      best = theme;
      bestHits = hits;
    }
  }

  return { theme: best || DEFAULT_THEME, hits: bestHits };
}

/** Extra signal quality bonuses so a well-specified idea scores above a vague one. */
function specificityBonus(text) {
  const words = String(text || '').trim().split(/\s+/).length;
  let bonus = 0;
  const notes = [];

  if (words >= 25) bonus += 4;
  else if (words < 10) {
    bonus -= 6;
    notes.push('The description is very short, so scores are conservative. Add the buyer, the pain and the wedge.');
  }

  // Naming a buyer is the single strongest predictor of a workable idea.
  if (/\b(nbfc|bank|clinic|school|msme|sme|founder|developer|cfo|hospital|retailer|manufacturer|agency|enterprise|startup)\b/i.test(text)) {
    bonus += 5;
  } else {
    notes.push('No specific buyer named. Opportunities without an identifiable purchaser rarely convert.');
  }

  if (/\b(india|indian|bharat|tier[- ]?2|tier[- ]?3)\b/i.test(text)) bonus += 3;

  return { bonus, notes };
}

// -----------------------------------------------------------------------------
// Idea Validator
// -----------------------------------------------------------------------------

export function heuristicValidation(ideaText, corpus = []) {
  const { theme, hits } = detectTheme(ideaText);
  const specificity = specificityBonus(ideaText);

  const scores = { ...theme.scores };
  // A strong keyword match nudges demand and timing up slightly.
  if (hits >= 3) {
    scores.demand = clampScore(scores.demand + 3);
    scores.timing = clampScore(scores.timing + 2);
  }

  const validationScore = clampScore(
    Math.round(
      scores.demand * 0.28 +
        scores.timing * 0.2 +
        scores.indiaRelevance * 0.18 +
        scores.feasibility * 0.14 +
        scores.competition * 0.1 +
        scores.regulation * 0.1
    ) + specificity.bonus
  );

  // Surface the closest existing briefs so the answer is grounded in real data.
  const related = rankCorpusByText(corpus, ideaText, 3);

  const verdict =
    validationScore >= 85
      ? 'Strong signal. Multiple independent drivers point the same way.'
      : validationScore >= 72
        ? 'Promising, with real demand but a competitive or execution caveat to resolve.'
        : validationScore >= 60
          ? 'Plausible but unproven. Gather direct evidence before committing.'
          : 'Weak signal as described. Sharpen the buyer and the pain, then re-run.';

  return {
    validationScore,
    verdict,
    scores,
    summary: [
      `Scored deterministically against the ${theme.key.replace('-', ' ')} pattern`,
      hits > 0 ? `matching ${hits} market keyword${hits === 1 ? '' : 's'}.` : 'with no strong market keyword match.',
      specificity.notes.join(' '),
    ]
      .filter(Boolean)
      .join(' '),
    gaps: theme.gaps,
    competitors: theme.competitors,
    mvpBuild: theme.mvpBuild,
    monetization: theme.monetization,
    risks: theme.risks,
    nextSteps: theme.nextSteps,
    relatedOpportunityIds: related.map((o) => o.id),
  };
}

/** Simple lexical overlap ranking. Used by validation and the chat retrieval step. */
export function rankCorpusByText(corpus, text, limit = 3) {
  const terms = String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 3);

  if (terms.length === 0 || corpus.length === 0) {
    return corpus.slice().sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const unique = Array.from(new Set(terms));

  const ranked = corpus
    .map((opp) => {
      const haystack = [
        opp.title,
        opp.problem,
        opp.industry,
        opp.vertical,
        opp.overview,
        opp.targetCustomer,
        opp.whyInteresting,
        opp.marketGap,
        ...(opp.skillSignals || []).map((s) => s.skill),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const overlap = unique.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      // Break ties toward higher-scoring briefs.
      return { opp, overlap, relevance: overlap + opp.score / 1000 };
    })
    .sort((a, b) => b.relevance - a.relevance);

  const matched = ranked.filter((row) => row.overlap >= 1).slice(0, limit);

  // A query like "give me 10" or "anything else" has no keyword overlap with
  // any brief, so keyword matching alone would return almost nothing even
  // though the corpus has plenty to offer. Backfill with the next
  // highest-scoring briefs (excluding ones already matched) so the model
  // always has up to `limit` items to work with instead of an empty context.
  if (matched.length < limit) {
    const matchedIds = new Set(matched.map((row) => row.opp.id));
    const backfill = ranked
      .filter((row) => !matchedIds.has(row.opp.id))
      .slice(0, limit - matched.length);
    return [...matched, ...backfill].map((row) => row.opp);
  }

  return matched.map((row) => row.opp);
}

// -----------------------------------------------------------------------------
// Builder Match
// -----------------------------------------------------------------------------

export function heuristicMatch(answers, corpus) {
  const skill = answers['q-skills'] || 'tech';
  const domain = answers['q-domain'] || 'IT';
  const capital = answers['q-capital'] || 'low';
  const time = answers['q-time'] || 'side';
  const risk = answers['q-risk'] || 'low';

  const matches = corpus.map((opp) => {
    let fitScore = 75;
    const reasons = [];

    if (opp.vertical === domain) {
      fitScore += 10;
      reasons.push(`Direct alignment with your ${domain} domain experience, which shortens your path to a first conversation.`);
    } else {
      fitScore -= 5;
    }

    const regulation = opp.scores?.regulation || 0;
    const skills = opp.scores?.skills || 0;

    if (skill === 'compliance' && regulation > 85) {
      fitScore += 12;
      reasons.push('Your regulatory background is the scarce input here, not the engineering.');
    } else if (skill === 'tech' && skills > 80) {
      fitScore += 8;
      reasons.push('Technical depth is the binding constraint, which suits a builder-led start.');
    } else if (skill === 'sales' && (opp.scores?.demand || 0) > 85) {
      fitScore += 7;
      reasons.push('Demand is already established, so distribution rather than invention decides the outcome.');
    } else if (skill === 'product' && (opp.scores?.competition || 0) > 70) {
      fitScore += 6;
      reasons.push('Incumbents leave positioning room, which rewards product judgement.');
    }

    if (risk === 'high' && regulation > 80) {
      fitScore += 8;
      reasons.push('Regulatory complexity here becomes a moat you have said you are willing to carry.');
    } else if (risk === 'low' && regulation > 85) {
      fitScore -= 15;
      reasons.push('Compliance exposure is heavier than your stated risk appetite.');
    }

    if (capital === 'low' && skills > 85) {
      fitScore -= 6;
      reasons.push('Deep specialist skills usually mean either hiring or a long solo ramp, which strains a bootstrap budget.');
    }
    if (capital === 'high' && (opp.scores?.timing || 0) > 88) {
      fitScore += 4;
      reasons.push('Funded speed matters because the timing window is open now.');
    }
    if (time === 'side' && skills > 85) {
      fitScore -= 5;
      reasons.push('The technical depth needed is hard to sustain on part-time hours.');
    }

    fitScore = Math.max(45, Math.min(98, fitScore));

    const complexity = skills > 85 ? 'High' : skills > 70 ? 'Medium' : 'Low';
    const mvpEffort = skills > 85 ? '8-12 weeks' : skills > 70 ? '4-6 weeks' : '2-3 weeks';

    return {
      opportunityId: opp.id,
      fitScore,
      rationale: reasons.length
        ? reasons.join(' ')
        : 'A reasonable fit on sector momentum and capital flexibility, without a standout advantage.',
      complexity,
      mvpEffort,
      firstStep:
        opp.mvpRecommendation ||
        'Talk to three potential buyers before writing any code, and write down what they say verbatim.',
      watchOut: (opp.risks && opp.risks[0]) || 'Validate that the buyer has a budget line for this, not just an opinion.',
    };
  });

  matches.sort((a, b) => b.fitScore - a.fitScore);

  return {
    matches,
    profileSummary: `Deterministic profile: ${skill} skillset, ${domain} domain, ${capital} capital, ${time === 'full' ? 'full-time' : 'part-time'} commitment, ${risk} regulatory risk appetite.`,
  };
}

// -----------------------------------------------------------------------------
// Career Signal
// -----------------------------------------------------------------------------

/** Skills we can detect lexically, grouped so we can reason about seniority. */
const SKILL_LEXICON = [
  'javascript', 'typescript', 'python', 'java', 'golang', 'rust', 'c++', 'kotlin', 'swift', 'php', 'ruby', 'scala',
  'react', 'next.js', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'fastapi',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'snowflake',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions', 'ci/cd',
  'machine learning', 'deep learning', 'nlp', 'pytorch', 'tensorflow', 'llm', 'rag', 'langchain', 'mlops',
  'sql', 'tableau', 'power bi', 'spark', 'airflow', 'dbt', 'etl',
  'rbi', 'sebi', 'kyc', 'aml', 'compliance', 'risk', 'audit', 'fraud', 'underwriting', 'upi', 'payments',
  'product management', 'agile', 'scrum', 'stakeholder management', 'roadmap',
  'figma', 'ux', 'ui design', 'accessibility',
];

const SENIORITY_PATTERNS = [
  { pattern: /\b(chief|cto|ceo|vp|vice president|head of|director)\b/i, label: 'Executive', bonus: 18 },
  { pattern: /\b(principal|staff|architect)\b/i, label: 'Principal / Staff', bonus: 14 },
  { pattern: /\b(lead|manager|senior|sr\.?)\b/i, label: 'Senior', bonus: 9 },
  { pattern: /\b(junior|jr\.?|intern|trainee|fresher|graduate)\b/i, label: 'Entry level', bonus: -8 },
];

function extractYears(text) {
  const matches = String(text).match(/(\d{1,2})\s*\+?\s*(?:years|yrs|year)\b/gi) || [];
  const years = matches
    .map((m) => Number.parseInt(m, 10))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 45);
  return years.length ? Math.max(...years) : null;
}

function guessRole(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ROLE_HINT = /\b(engineer|developer|manager|analyst|architect|consultant|designer|scientist|lead|officer|specialist|administrator)\b/i;

  // Resumes usually put the current title within the first several lines.
  const candidate = lines.slice(0, 12).find((line) => ROLE_HINT.test(line) && line.length < 90);
  return candidate ? candidate.replace(/[|,•·]+.*$/, '').trim() : 'Not detected';
}

function guessName(text, fileName) {
  const firstLines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);

  // A name line is short, title-cased, and free of contact punctuation.
  const candidate = firstLines.find(
    (line) =>
      line.length >= 4 &&
      line.length <= 42 &&
      /^[A-Za-z][A-Za-z.'\- ]+$/.test(line) &&
      !/@|\d|resume|curriculum|vitae|profile|summary/i.test(line) &&
      line.split(/\s+/).length <= 4
  );
  if (candidate) return candidate;

  // A real upload is often named after its owner, but our synthetic paste
  // filename is not, so it must not be mined for a name.
  const raw = String(fileName || '');
  const fromFile = /^pasted-resume/i.test(raw)
    ? ''
    : raw
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b(resume|cv|final|updated|latest|\d+)\b/gi, '')
        .trim();

  return fromFile ? fromFile.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Candidate';
}

export function heuristicResume(resumeText, fileName, corpus = []) {
  const text = String(resumeText || '');
  const lower = text.toLowerCase();

  const skills = SKILL_LEXICON.filter((skill) => lower.includes(skill)).map((skill) =>
    skill.replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const seniority = SENIORITY_PATTERNS.find((s) => s.pattern.test(text));
  const years = extractYears(text);

  // Demand score: breadth of in-demand skills, seniority, and experience length.
  let demandScore = 46;
  demandScore += Math.min(28, skills.length * 2.2);
  demandScore += seniority?.bonus || 0;
  if (years) demandScore += Math.min(12, years * 1.2);
  // Skills that appear in the live opportunity corpus are worth more.
  const corpusSkills = new Set(
    corpus.flatMap((opp) => (opp.skillSignals || []).map((s) => s.skill.toLowerCase()))
  );
  const scarceMatches = skills.filter((skill) =>
    Array.from(corpusSkills).some((cs) => cs.includes(skill.toLowerCase()))
  );
  demandScore += Math.min(10, scarceMatches.length * 3);
  demandScore = clampScore(demandScore);

  // Recommendations come from the scarcest skills in the live corpus that the
  // candidate does not already have.
  const gapPool = corpus
    .flatMap((opp) =>
      (opp.skillSignals || []).map((signal) => ({
        skill: signal.skill,
        scarcity: signal.scarcity,
        why: signal.impact,
        roleImpacted: (opp.hiringSignals && opp.hiringSignals[0]?.role) || opp.title,
        weight: signal.scarcity === 'Critical' ? 3 : signal.scarcity === 'High' ? 2 : 1,
        oppScore: opp.score,
      }))
    )
    .filter((row) => !skills.some((s) => row.skill.toLowerCase().includes(s.toLowerCase())));

  const seen = new Set();
  const recommendations = gapPool
    .filter((row) => {
      const key = row.skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.weight - a.weight || b.oppScore - a.oppScore)
    .slice(0, 4)
    .map((row) => ({
      skill: row.skill,
      impactScore: Math.min(30, row.weight * 5 + Math.round(row.oppScore / 20)),
      difficulty: row.weight === 3 ? 'High' : row.weight === 2 ? 'Medium' : 'Low',
      roleImpacted: row.roleImpacted,
      why: row.why || 'Named as a scarce requirement in a currently rising opportunity cluster.',
    }));

  const adjacentPaths = corpus
    .slice()
    .sort((a, b) => (b.scores?.hiring || 0) - (a.scores?.hiring || 0))
    .slice(0, 3)
    .map((opp) => {
      const role = (opp.hiringSignals && opp.hiringSignals[0]) || null;
      return {
        role: role?.role || `${opp.vertical} specialist`,
        salaryJump: role?.salaryRange || 'Market dependent',
        demandIndex: opp.scores?.hiring || opp.score,
        bridgeSkill: (opp.skillSignals && opp.skillSignals[0]?.skill) || 'Domain fundamentals',
      };
    });

  const matched = rankCorpusByText(corpus, `${skills.join(' ')} ${guessRole(text)}`, 3);

  return {
    name: guessName(text, fileName),
    currentRole: guessRole(text),
    seniority: seniority?.label || (years && years > 5 ? 'Mid-senior' : 'Mid level'),
    skills: skills.slice(0, 24),
    demandScore,
    summary: [
      `Detected ${skills.length} recognisable skill${skills.length === 1 ? '' : 's'}`,
      years ? `and approximately ${years} years of stated experience.` : 'from the supplied text.',
      scarceMatches.length
        ? `${scarceMatches.length} of them appear as scarce requirements in the current opportunity feed.`
        : 'None of them currently appear as scarce requirements in the opportunity feed, which is where the upside lies.',
    ].join(' '),
    recommendations,
    adjacentPaths,
    matchedOpportunityIds: matched.map((o) => o.id),
  };
}

// -----------------------------------------------------------------------------
// Suggested Roadmap
// -----------------------------------------------------------------------------

/**
 * Phase templates per goal kind. The deterministic tier cannot invent a plan
 * specific to one idea, so it produces a defensible generic sequence and fills
 * in what it can actually derive: the detected theme, the closest briefs, the
 * scarce skills those briefs name, and a schedule scaled to the hours offered.
 */
const ROADMAP_BLUEPRINTS = {
  idea: [
    {
      name: 'Prove the problem',
      objective: 'Establish that a named buyer feels this pain enough to pay for relief.',
      tasks: [
        'Write down the exact job title of the person who would sign the cheque.',
        'Find fifteen public instances of that person describing this problem, in forums, review sites or job posts.',
        'Run five 20-minute interviews and ask what they do about it today and what that costs them.',
      ],
      deliverable: 'A one-page problem brief quoting five real people in their own words.',
      successMetric: 'At least three of five interviewees describe a workaround they already pay for.',
      effort: 'Medium',
    },
    {
      name: 'Sell before you build',
      objective: 'Test whether the offer earns money, not just agreement.',
      tasks: [
        'Write a landing page that states the outcome and a price, not the features.',
        'Take the offer back to the same five people and ask for a paid pilot or a letter of intent.',
        'Deliver the first result manually, by hand, with no product at all.',
      ],
      deliverable: 'A priced offer and at least one signed pilot or prepayment.',
      successMetric: 'One buyer commits money or a start date.',
      effort: 'Medium',
    },
    {
      name: 'Build the thinnest product',
      objective: 'Automate only the step that hurts most when done by hand.',
      tasks: [
        'List every manual step from the concierge delivery and time each one.',
        'Automate the single most expensive step and leave the rest manual.',
        'Ship to your pilot user and watch them use it without helping.',
      ],
      deliverable: 'A working tool that one real customer uses unaided.',
      successMetric: 'The pilot user completes the core job without asking you for help.',
      effort: 'High',
    },
    {
      name: 'Make it repeatable',
      objective: 'Turn one customer into a channel that produces more of them.',
      tasks: [
        'Write down exactly how the first customer was found and repeat that path deliberately.',
        'Instrument activation and retention so churn is visible before it happens.',
        'Set a price you can defend and raise it once for the next cohort.',
      ],
      deliverable: 'A documented acquisition path with a measured conversion rate.',
      successMetric: 'Three customers acquired the same way.',
      effort: 'Medium',
    },
  ],
  role: [
    {
      name: 'Audit the gap',
      objective: 'Know precisely which skills stand between you and the target role.',
      tasks: [
        'Collect twenty live job descriptions for the target role in your city and remote.',
        'Tally every requirement and mark the ones you cannot evidence today.',
        'Pick the three that appear most often and that you can learn fastest.',
      ],
      deliverable: 'A ranked skill gap list backed by real postings.',
      successMetric: 'Three named gaps with a learning plan each.',
      effort: 'Low',
    },
    {
      name: 'Build proof, not certificates',
      objective: 'Produce artefacts a hiring manager can inspect.',
      tasks: [
        'Build one small project that exercises the top gap end to end.',
        'Write it up as a problem, decision and outcome, not a tutorial log.',
        'Publish it where the role reviews candidates: GitHub, a blog, or a public demo.',
      ],
      deliverable: 'Two public artefacts demonstrating the scarce skills.',
      successMetric: 'A stranger in the field gives unsolicited feedback on one.',
      effort: 'High',
    },
    {
      name: 'Get in front of people',
      objective: 'Convert proof into conversations.',
      tasks: [
        'Rewrite the resume around outcomes and the newly evidenced skills.',
        'Message ten practitioners in the role and ask what they wish they had known.',
        'Apply to roles in a deliberate batch so you can compare feedback.',
      ],
      deliverable: 'A tightened resume and ten real conversations.',
      successMetric: 'Two screening calls booked.',
      effort: 'Medium',
    },
  ],
  startup: [
    {
      name: 'Find the binding constraint',
      objective: 'Identify the one number that is actually holding growth back.',
      tasks: [
        'Map the funnel from first touch to renewal and put a real number on every step.',
        'Interview five churned or stalled accounts and ask what changed.',
        'Pick the single stage with the worst drop-off and make it the quarter goal.',
      ],
      deliverable: 'An instrumented funnel with one named constraint.',
      successMetric: 'The team agrees on one bottleneck rather than four priorities.',
      effort: 'Medium',
    },
    {
      name: 'Fix it in one lane',
      objective: 'Run focused experiments against that constraint only.',
      tasks: [
        'Design three experiments that could plausibly move the constraint metric.',
        'Run them sequentially with a clear stop rule for each.',
        'Kill anything that has not moved the number within its window.',
      ],
      deliverable: 'Three completed experiments with recorded outcomes.',
      successMetric: 'The constraint metric improves measurably, or is proven immovable.',
      effort: 'High',
    },
    {
      name: 'Make the gain durable',
      objective: 'Turn the winning experiment into a process the team runs without you.',
      tasks: [
        'Document the winning motion as a repeatable playbook.',
        'Assign an owner and a weekly review of the constraint metric.',
        'Re-run the funnel map and name the next constraint.',
      ],
      deliverable: 'A playbook with an owner and a review cadence.',
      successMetric: 'The metric holds for two consecutive months without heroics.',
      effort: 'Medium',
    },
  ],
};

/** Splits the horizon across phases so timeframes are consistent with the ask. */
function phaseTimeframes(horizon, count) {
  const totalWeeks = { '30 days': 4, '90 days': 12, '6 months': 26, '12 months': 52 }[horizon] || 12;
  const per = Math.max(1, Math.round(totalWeeks / count));

  let cursor = 1;
  return Array.from({ length: count }, (_, index) => {
    const start = cursor;
    const end = index === count - 1 ? totalWeeks : Math.min(totalWeeks, start + per - 1);
    cursor = end + 1;
    return start === end ? `Week ${start}` : `Week ${start}-${end}`;
  });
}

export function heuristicRoadmap(input, corpus = []) {
  const { goal = '', kind = 'idea', horizon = '90 days', experience = '', hoursPerWeek = 10 } = input || {};

  const blueprint = ROADMAP_BLUEPRINTS[kind] || ROADMAP_BLUEPRINTS.idea;
  const { theme, hits } = detectTheme(`${goal} ${experience}`);
  const related = rankCorpusByText(corpus, `${goal} ${experience}`, 3);
  const timeframes = phaseTimeframes(horizon, blueprint.length);

  const specificity = specificityBonus(goal);
  const capacityPenalty = hoursPerWeek < 6 ? 12 : hoursPerWeek < 12 ? 5 : 0;
  const readinessScore = clampScore(
    52 + specificity.bonus + Math.min(12, hits * 3) + (experience.trim() ? 8 : 0) - capacityPenalty
  );

  // Scarce skills named by the closest briefs are the most defensible
  // recommendation this tier can make, because they come from real signals.
  const skillsToLearn = related
    .flatMap((opp) => (opp.skillSignals || []).map((s) => ({ ...s, from: opp.title })))
    .slice(0, 4)
    .map((signal) => ({
      skill: signal.skill,
      why: signal.impact || `Named as a ${String(signal.scarcity).toLowerCase()} scarcity skill in ${signal.from}.`,
      resource: 'Official documentation plus one small project that uses it end to end.',
    }));

  const phases = blueprint.map((phase, index) => ({
    ...phase,
    timeframe: timeframes[index],
    tasks: [...phase.tasks],
  }));

  // A very part-time schedule cannot carry the full plan, so say so rather than
  // quietly handing over something undeliverable.
  if (hoursPerWeek > 0 && hoursPerWeek < 6) {
    phases[0].tasks.push(
      `At ${hoursPerWeek} hours a week, treat each phase as roughly double the stated timeframe, or cut the scope of the first deliverable in half.`
    );
  }

  return {
    title: `${horizon} plan: ${goal.trim().slice(0, 60)}${goal.trim().length > 60 ? '…' : ''}`,
    summary: [
      `Built deterministically from the ${kind} playbook`,
      hits > 0
        ? `against the ${theme.key.replace(/-/g, ' ')} pattern, which matched ${hits} market keyword${hits === 1 ? '' : 's'}.`
        : 'with no strong market keyword match, so the sequence is generic rather than sector-specific.',
      'Each phase is ordered so it produces the evidence the next phase depends on.',
    ].join(' '),
    northStar:
      kind === 'role'
        ? 'Screening calls booked with teams hiring for the target role.'
        : kind === 'startup'
          ? 'Movement in the single constraint metric you named.'
          : 'Paying customers who renew without being chased.',
    readinessScore,
    phases,
    skillsToLearn,
    milestones: phases.map((phase, index) => ({
      label: phase.deliverable,
      when: phase.timeframe.replace('Week', 'By week').replace(/(\d+)-(\d+)/, '$2'),
      proof: phase.successMetric,
      _index: index,
    })).map(({ _index, ...m }) => m),
    quickWins: [
      'Write the goal as a single sentence naming who benefits and how you would know it worked.',
      related.length
        ? `Read the brief for "${related[0].title}" and steal its evidence list.`
        : 'Search the radar for the closest existing opportunity and read its evidence list.',
      'Block the hours in your calendar now; an unscheduled plan is a wish.',
    ],
    risks: [
      hoursPerWeek < 6
        ? 'The available time is below what this plan needs, so slippage is the default outcome without a scope cut.'
        : 'Time gets absorbed by building before the problem is confirmed.',
      'Feedback is collected from friends rather than buyers, which produces agreement instead of revenue.',
      ...theme.risks.slice(0, 1),
    ],
    relatedOpportunityIds: related.map((o) => o.id),
  };
}

// -----------------------------------------------------------------------------
// Chat
// -----------------------------------------------------------------------------

export function heuristicChat(message, corpus) {
  const matches = rankCorpusByText(corpus, message, 12);

  if (matches.length === 0) {
    return {
      answer:
        'Live AI is unavailable right now, so I am answering from a keyword search over the opportunity database, and nothing matched your question closely. Try naming a sector (BFSI, IT), a technology (UPI, LLM, GST) or a role, and I will point you at the relevant briefs.',
      citedOpportunityIds: [],
      followUps: [
        'Which opportunities have the strongest regulatory driver?',
        'What is rising fastest in BFSI?',
        'Which opportunity needs the least capital to start?',
      ],
      disclaimer: 'Keyword retrieval without model reasoning.',
    };
  }

  const lines = matches.map((opp, index) => {
    const parts = [
      `${index + 1}. ${opp.title} (score ${opp.score}, ${opp.momentum}).`,
      opp.problem,
      opp.marketGap ? `Gap: ${opp.marketGap}` : '',
      opp.mvpRecommendation ? `Suggested first build: ${opp.mvpRecommendation}` : '',
    ];
    return parts.filter(Boolean).join(' ');
  });

  return {
    answer: [
      'Live AI is unavailable, so this is a keyword match over the opportunity database rather than a generated answer. The closest briefs are:',
      '',
      ...lines,
      '',
      'Open any brief for the full evidence: hiring signals, regulatory drivers, competition and risks.',
    ].join('\n'),
    citedOpportunityIds: matches.map((o) => o.id),
    followUps: [
      `What is the market gap in ${matches[0].title}?`,
      `Who would buy ${matches[0].title}?`,
      'Which of these needs the least capital?',
    ],
    disclaimer: 'Keyword retrieval without model reasoning.',
  };
}
