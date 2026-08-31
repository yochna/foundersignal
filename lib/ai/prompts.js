/**
 * Prompt builders.
 *
 * Prompts stay compact on purpose: the free Gemini tier has a small quota, and
 * shorter prompts mean lower latency and less truncation risk. Each one states
 * the exact JSON contract, because the response is machine-parsed.
 */

const ANALYST_PERSONA = `You are a senior market analyst specialising in the Indian startup ecosystem (BFSI, IT services, SaaS, and regulated fintech).
You reason from evidence: hiring demand, regulatory change, community complaints, and technology shifts.
You are candid. If an idea is weak, you say so and explain what is missing.
You never invent specific statistics, company revenue figures, or funding amounts.
Indian market context matters: RBI, SEBI, NPCI, GSTN, DPDP, UPI, Account Aggregator, tier-2/3 dynamics.
Respond with JSON only. No prose outside the JSON. No markdown fences.`;

/** Compact corpus rendering so the model can ground answers and cite ids. */
function renderCorpus(opportunities, limit = 10) {
  return opportunities
    .slice(0, limit)
    .map(
      (opp) =>
        `- id:${opp.id} | ${opp.title} | ${opp.vertical} | score:${opp.score} | momentum:${opp.momentum} | problem:${String(
          opp.problem || ''
        ).slice(0, 150)}`
    )
    .join('\n');
}

export function buildValidationPrompt({ idea, corpus }) {
  return {
    systemInstruction: ANALYST_PERSONA,
    parts: [
      {
        text: `Evaluate this startup idea for the Indian market.

IDEA:
"""
${idea}
"""

EXISTING OPPORTUNITIES IN OUR DATABASE (use ids verbatim if any are genuinely related):
${renderCorpus(corpus)}

Score each dimension 0-100:
- demand: how many people demonstrably have this problem now
- competition: HIGHER means incumbents leave MORE room (a weak competitive field scores high)
- feasibility: how buildable a first version is for a small team
- timing: whether the window is open now rather than in two years
- indiaRelevance: how India-specific the problem and buyer are
- regulation: how much regulatory pressure forces a purchase

Return exactly this JSON shape:
{
  "validationScore": 0-100,
  "verdict": "one blunt sentence",
  "scores": { "demand":0, "competition":0, "feasibility":0, "timing":0, "indiaRelevance":0, "regulation":0 },
  "summary": "2-3 sentences on what the evidence actually supports",
  "gaps": ["specific unserved gap", "..."],
  "competitors": [{ "name": "real company or category", "note": "why they do or do not cover this" }],
  "mvpBuild": "the smallest concrete first version, 2 sentences",
  "monetization": "pricing model with an Indian-market-appropriate figure",
  "risks": ["what would most plausibly kill this", "..."],
  "nextSteps": ["a concrete action for this week", "..."],
  "relatedOpportunityIds": ["ids from the list above, or empty"]
}`,
      },
    ],
  };
}

export function buildMatchPrompt({ answers, questions, corpus }) {
  const profile = questions
    .map((question) => {
      const value = answers[question.id];
      const option = question.options.find((o) => o.value === value);
      return `- ${question.questionText} => ${option?.text || value || 'not answered'}`;
    })
    .join('\n');

  return {
    systemInstruction: ANALYST_PERSONA,
    parts: [
      {
        text: `Rank these opportunities against one founder's profile.

FOUNDER PROFILE:
${profile}

OPPORTUNITIES:
${renderCorpus(corpus, 12)}

Judge fit on: domain overlap, whether their skillset addresses the binding constraint, capital requirement versus available capital, time commitment versus complexity, and regulatory risk appetite versus regulatory exposure.
Be discriminating: spread fitScore across the range rather than clustering everything near 80. Rank every opportunity supplied.

Return exactly this JSON shape:
{
  "profileSummary": "one sentence characterising this founder's edge",
  "matches": [
    {
      "opportunityId": "id from the list",
      "fitScore": 0-100,
      "rationale": "2 sentences on why this fits or does not, referencing their specific answers",
      "complexity": "Low|Medium|High",
      "mvpEffort": "e.g. 4-6 weeks",
      "firstStep": "the concrete first action for this person",
      "watchOut": "the specific thing that would trip up this founder here"
    }
  ]
}`,
      },
    ],
  };
}

export function buildResumePrompt({ resumeText, fileData, corpus }) {
  const instruction = `Analyse this resume against the current Indian technology job market.

OPPORTUNITY CLUSTERS WE TRACK (their skill requirements are the market signal):
${renderCorpus(corpus, 10)}

SCARCE SKILLS NAMED IN THOSE CLUSTERS:
${corpus
  .flatMap((opp) => (opp.skillSignals || []).map((s) => `- ${s.skill} (${s.scarcity}): ${s.impact}`))
  .slice(0, 14)
  .join('\n')}

Extract what is actually present. Do not invent skills, employers or dates that are not in the document.
demandScore reflects how sought-after this exact profile is in the Indian market right now.
Recommend skills the candidate does NOT already have, chosen from the scarce list above where relevant.

Return exactly this JSON shape:
{
  "name": "candidate name or empty string",
  "currentRole": "their current title",
  "seniority": "Entry level|Mid level|Senior|Principal / Staff|Executive",
  "skills": ["skills actually found in the document"],
  "demandScore": 0-100,
  "summary": "2-3 sentences on their market position, honest about weaknesses",
  "recommendations": [
    { "skill": "skill to add", "impactScore": 1-30, "difficulty": "Low|Medium|High", "roleImpacted": "role this unlocks", "why": "one sentence" }
  ],
  "adjacentPaths": [
    { "role": "adjacent role they could reach", "salaryJump": "e.g. 25-40% or a band", "demandIndex": 0-100, "bridgeSkill": "the one skill that bridges them" }
  ],
  "matchedOpportunityIds": ["ids where this person could plausibly build or be hired"]
}`;

  const parts = [];

  // Gemini reads PDFs natively via inlineData, so no PDF parsing library is
  // needed. Text is used when the upload was a paste or a plain-text file.
  if (fileData?.base64 && fileData?.mimeType) {
    parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
    parts.push({ text: instruction });
  } else {
    parts.push({
      text: `${instruction}

RESUME TEXT:
"""
${String(resumeText || '').slice(0, 14000)}
"""`,
    });
  }

  return { systemInstruction: ANALYST_PERSONA, parts };
}

export function buildChatPrompt({ message, history, retrieved, corpusSize }) {
  const context = retrieved
    .map(
      (opp) => `### ${opp.title} (id: ${opp.id})
Sector: ${opp.vertical} | Score: ${opp.score} | Momentum: ${opp.momentum} (${opp.changePercentage}%)
Problem: ${opp.problem}
Buyer: ${opp.targetCustomer}
Overview: ${String(opp.overview || '').slice(0, 420)}
Market gap: ${String(opp.marketGap || '').slice(0, 280)}
Suggested MVP: ${String(opp.mvpRecommendation || '').slice(0, 240)}
Monetisation: ${String(opp.monetizationHypothesis || '').slice(0, 200)}
Risks: ${(opp.risks || []).join(' | ').slice(0, 280)}`
    )
    .join('\n\n');

  const transcript = history
    .slice(-6)
    .map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
    .join('\n');

  return {
    systemInstruction: `${ANALYST_PERSONA}

You are the FounderSignal copilot. Answer strictly from the supplied opportunity context.
If the context does not contain the answer, say so plainly and suggest what the user could ask instead. Never fabricate an opportunity that is not listed.
The context below is a subset (the most relevant ${retrieved.length} of ${corpusSize ?? retrieved.length} total opportunities in the feed) — it is not the whole corpus. If asked for more than are shown, say how many total exist and suggest narrowing by domain, skill, or hours available to surface a different subset, rather than claiming none remain.
Cite the ids you actually used. Keep answers under 220 words and use plain language.`,
    parts: [
      {
        text: `OPPORTUNITY CONTEXT (top ${retrieved.length} of ${corpusSize ?? retrieved.length} total in the feed):
${context || '(no matching opportunities were retrieved)'}

${transcript ? `CONVERSATION SO FAR:\n${transcript}\n` : ''}
USER QUESTION: ${message}

Return exactly this JSON shape:
{
  "answer": "your answer, plain text, may use newlines",
  "citedOpportunityIds": ["ids you actually used"],
  "followUps": ["a useful next question", "another"],
  "disclaimer": "only if you had to caveat the answer, else empty string"
}`,
      },
    ],
  };
}

export function buildRoadmapPrompt({ goal, kind, horizon, experience, hoursPerWeek, corpus }) {
  const framing = {
    role: 'a person targeting this role',
    idea: 'a founder taking this idea from nothing to a first paying customer',
    startup: 'an operator growing this existing startup',
  }[kind] || 'a founder';

  return {
    systemInstruction: `${ANALYST_PERSONA}

You write execution plans, not motivational advice. Every task must be something a person can start on a specific day and finish. Never write "do market research" when you could write "interview 5 GST practitioners from the ICAI directory and ask what they charge".`,
    parts: [
      {
        text: `Build a ${horizon} roadmap for ${framing}.

WHAT THEY WANT TO DO (${kind}):
"""
${goal}
"""

THEIR STARTING POINT: ${experience || 'not stated, assume a capable generalist with no domain contacts'}
TIME AVAILABLE: about ${hoursPerWeek} hours per week

RELATED OPPORTUNITIES WE TRACK (cite ids only if genuinely relevant):
${renderCorpus(corpus, 8)}

Rules:
- Fit the plan to ${hoursPerWeek} hours a week. Do not plan full-time work for someone with 5 spare hours.
- Sequence phases so each one produces evidence that justifies starting the next.
- readinessScore is how ready this person appears to be for this goal today, 0-100, judged from what they told you.
- Name Indian specifics where they matter: GSTN, RBI sandbox, DPDP, UPI, ONDC, ICAI, MSME registries, tier-2 distribution.

Return exactly this JSON shape. Every array element must be an object with the keys shown, never a bare string:
{
  "title": "short name for this plan",
  "summary": "2-3 sentences on the strategy and why this sequence",
  "northStar": "the single metric that tells them it is working",
  "readinessScore": 0-100,
  "phases": [
    {
      "name": "phase name",
      "timeframe": "e.g. Week 1-2",
      "objective": "what this phase proves or produces",
      "tasks": ["concrete task", "another concrete task"],
      "deliverable": "the artefact that exists at the end",
      "successMetric": "the number or answer that says this phase worked",
      "effort": "Low|Medium|High"
    }
  ],
  "skillsToLearn": [
    { "skill": "skill or tool", "why": "what it unblocks", "resource": "a specific type of resource, docs or course" }
  ],
  "milestones": [
    { "label": "milestone", "when": "e.g. Day 30", "proof": "the evidence it is genuinely done" }
  ],
  "quickWins": ["something worth doing in the first 48 hours", "..."],
  "risks": ["the most likely reason this plan stalls", "..."],
  "relatedOpportunityIds": ["ids from the list above, or empty"]
}`,
      },
    ],
  };
}

export function buildEnrichmentPrompt({ clusterName, signals, existing }) {
  return {
    systemInstruction: ANALYST_PERSONA,
    parts: [
      {
        text: `Turn this cluster of raw market signals into one structured startup opportunity brief for the Indian market.

CLUSTER: ${clusterName}

RAW SIGNALS (${signals.length}):
${signals.map((s, i) => `${i + 1}. [${s.source}] ${String(s.text).slice(0, 260)}`).join('\n')}

${existing ? `PREVIOUS BRIEF FOR THIS CLUSTER (update it; keep the id "${existing.id}"):\nTitle: ${existing.title}\nScore: ${existing.score}\n` : ''}
Ground every claim in the signals above. Where you must generalise from market knowledge, keep it qualitative rather than inventing numbers.
Scoring: demand, hiring, regulation, skills (scarcity), competition (HIGHER means more room for a newcomer), timing, indiaRelevance. Overall score is a weighted blend, 0-100.

Return exactly this JSON shape:
{
  "id": "${existing?.id || 'kebab-case-slug'}",
  "title": "specific, non-generic opportunity title",
  "problem": "one sentence naming the pain",
  "targetCustomer": "who pays",
  "industry": "e.g. BFSI / RegTech",
  "vertical": "IT|BFSI|HealthTech|EdTech|ClimateTech|AgriTech|Logistics|ECommerce",
  "score": 0-100,
  "scores": { "demand":0,"hiring":0,"regulation":0,"skills":0,"competition":0,"timing":0,"indiaRelevance":0 },
  "momentum": "rising|steady|declining",
  "changePercentage": 0,
  "whyInteresting": "why these signals converge, one sentence",
  "overview": "3-4 sentences",
  "whyMatters": "the consequence of not solving it",
  "demandAnalysis": "what the evidence shows about demand",
  "signalsTimeline": [{"date":"Mar 26","value":0},{"date":"Apr 26","value":0},{"date":"May 26","value":0},{"date":"Jun 26","value":0},{"date":"Jul 26","value":0},{"date":"Aug 26","value":0}],
  "hiringSignals": [{"role":"","volume":"High|Medium|Low","salaryRange":"","count":0}],
  "skillSignals": [{"skill":"","scarcity":"Critical|High|Medium","impact":""}],
  "regulatorySignals": [{"regulationName":"","agency":"","summary":"","date":""}],
  "technologySignals": [{"tech":"","adoptionRate":"","description":""}],
  "competitionList": [{"name":"","category":"","strength":"Strong|Medium|Emerging|Weak","pricing":""}],
  "marketGap": "what nobody covers",
  "mvpRecommendation": "the smallest sellable first version",
  "monetizationHypothesis": "pricing model with an India-appropriate figure",
  "risks": ["", ""],
  "indiaRelevanceText": "why this is India-specific"
}`,
      },
    ],
  };
}
