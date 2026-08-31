import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasGemini } from '@/lib/config';
import { callGemini } from '@/lib/ai/gemini';
import { parseModelJson } from '@/lib/ai/json';

export const dynamic = 'force-dynamic';

const BLUEPRINT_PROMPTS = {
  roadmap: (idea, verdict) => `You are a Principal Software Architect. For the following validated Indian startup idea, generate a concrete 4-Week Technical MVP Build Roadmap.
Idea: "${idea}"
Scored Verdict: "${verdict}"

Format your response strictly as valid JSON matching this schema:
{
  "title": "4-Week Technical MVP Roadmap",
  "recommendedStack": ["Next.js App Router", "Tailwind CSS", "PostgreSQL / Supabase", "Gemini 2.0 Flash", "Razorpay / Setu API"],
  "weeks": [
    {
      "week": 1,
      "focus": "Core Architecture & Data Ingestion",
      "deliverables": ["Database schemas & audit tables", "Data ingestion connectors", "Mock pipeline tests"],
      "tools": ["Next.js 14", "PostgreSQL"]
    },
    {
      "week": 2,
      "focus": "Business Logic & Integration",
      "deliverables": ["Core scoring algorithm", "Indian fintech API sandbox integration", "Authentication & profile models"],
      "tools": ["Zod", "Tailwind CSS"]
    },
    {
      "week": 3,
      "focus": "Security, Compliance & Multi-tenancy",
      "deliverables": ["DPDP consent logger", "RBI rate-limit guardrails", "Role-based tenant isolation"],
      "tools": ["Crypto", "NextAuth"]
    },
    {
      "week": 4,
      "focus": "Pilot Deployment & Telemetry",
      "deliverables": ["Observability & usage dashboards", "First 3 pilot customer invites", "Staging verification"],
      "tools": ["Vercel", "Sentry"]
    }
  ]
}`,

  compliance: (idea, verdict) => `You are a Senior Indian Regulatory & Fintech Legal Expert. For the following startup idea, generate a mandatory Indian Regulatory Compliance Checklist covering RBI, SEBI, IRDAI, and DPDP obligations.
Idea: "${idea}"
Scored Verdict: "${verdict}"

Format your response strictly as valid JSON matching this schema:
{
  "title": "Mandatory Regulatory & Compliance Checklist",
  "primaryRegulator": "RBI / SEBI / DPDP Board",
  "applicableActs": ["DPDP Act 2023", "PMLA Act", "RBI Master Directions"],
  "checklist": [
    {
      "category": "Data & Privacy",
      "requirement": "Explicit bilingual consent & data localisation in Indian data centers",
      "mandatoryBy": "Day 1 Launch",
      "penaltyRisk": "High (up to ₹250 Cr under DPDP)"
    },
    {
      "category": "Licensing & Aggregation",
      "requirement": "Payment Aggregator (PA) or Lending Service Provider (LSP) registration",
      "mandatoryBy": "Pre-revenue",
      "penaltyRisk": "Critical"
    },
    {
      "category": "Audit & Security",
      "requirement": "CERT-In compliance & SOC2 Type II 180-day log retention",
      "mandatoryBy": "Quarter 1",
      "penaltyRisk": "Medium"
    }
  ]
}`,

  icp: (idea, verdict) => `You are a B2B SaaS Enterprise Go-To-Market Director in India. For the following startup idea, define 3 concrete Ideal Customer Profiles (ICPs) and Indian enterprise buyer archetypes.
Idea: "${idea}"
Scored Verdict: "${verdict}"

Format your response strictly as valid JSON matching this schema:
{
  "title": "Target Enterprise Pilot Customer Archetypes",
  "icps": [
    {
      "segment": "Mid-market NBFCs & Fintech Lenders",
      "companySize": "50-500 employees (AUM ₹100Cr - ₹2,000Cr)",
      "economicBuyer": "Chief Risk Officer / Head of Collections",
      "urgencyTrigger": "Recent RBI inspection warning or high NPA slippage",
      "salesCycle": "4 - 8 weeks",
      "willingnessToPay": "₹1.5L - ₹4L / month"
    },
    {
      "segment": "Tier-2 Co-operative & Small Finance Banks",
      "companySize": "200-1,000 employees",
      "economicBuyer": "Head of IT / Operations",
      "urgencyTrigger": "Statutory audit observation",
      "salesCycle": "8 - 14 weeks",
      "willingnessToPay": "₹3L - ₹8L / month"
    }
  ]
}`,
};

const DETERMINISTIC_FALLBACKS = {
  roadmap: {
    title: '4-Week Technical MVP Roadmap',
    recommendedStack: ['Next.js 14 App Router', 'Tailwind CSS', 'PostgreSQL / Supabase', 'Gemini AI', 'Razorpay API'],
    weeks: [
      {
        week: 1,
        focus: 'Core Architecture & Schema',
        deliverables: ['Database schemas & migrations', 'Local JSON & Supabase dual driver', 'API route templates'],
      },
      {
        week: 2,
        focus: 'Domain Engine & Heuristics',
        deliverables: ['Scoring algorithms', 'Mock test suites', 'Interactive dashboard components'],
      },
      {
        week: 3,
        focus: 'Compliance & Guardrails',
        deliverables: ['Token spend limiter', 'DPDP audit trail', 'Role-based access'],
      },
      {
        week: 4,
        focus: 'Pilot Launch & Observability',
        deliverables: ['Admin usage monitoring', 'End-to-end smoke verification', 'Pilot onboarding'],
      },
    ],
  },
  compliance: {
    title: 'Mandatory Regulatory & Compliance Checklist',
    primaryRegulator: 'RBI & DPDP Board',
    applicableActs: ['DPDP Act 2023', 'RBI Digital Lending Guidelines', 'CERT-In Mandate'],
    checklist: [
      {
        category: 'Data Privacy',
        requirement: 'Indian cloud data localisation and bilingual user consent flow',
        mandatoryBy: 'Day 1 Launch',
        penaltyRisk: 'Critical (DPDP Section 33)',
      },
      {
        category: 'Information Security',
        requirement: 'Mandatory 180-day audit log retention for CERT-In compliance',
        mandatoryBy: 'Pre-launch',
        penaltyRisk: 'High',
      },
      {
        category: 'Financial Operations',
        requirement: 'Direct account-to-account settlement via licensed payment aggregator',
        mandatoryBy: 'Pre-revenue',
        penaltyRisk: 'Critical',
      },
    ],
  },
  icp: {
    title: 'Target Enterprise Pilot Customer Archetypes',
    icps: [
      {
        segment: 'Mid-Market NBFCs & Digital Lenders',
        companySize: '50 - 500 employees',
        economicBuyer: 'Chief Risk Officer / Head of Compliance',
        urgencyTrigger: 'Quarterly RBI inspection or rapid scale compliance audit',
        willingnessToPay: '₹1.5L - ₹4L / month',
      },
      {
        segment: 'B2B SaaS Growth Companies (Series A+)',
        companySize: '20 - 200 engineers',
        economicBuyer: 'VP Engineering / CTO',
        urgencyTrigger: 'Runaway token spend and unmonitored prompt injection vectors',
        willingnessToPay: '₹1L - ₹2.5L / month',
      },
    ],
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { idea, verdict, type } = body;

    if (!idea || !type || !BLUEPRINT_PROMPTS[type]) {
      return NextResponse.json(
        { error: { message: 'Invalid follow-up request. Required: idea, type (roadmap|compliance|icp)' } },
        { status: 400 }
      );
    }

    let resultData = DETERMINISTIC_FALLBACKS[type];
    let source = 'fallback';

    if (hasGemini) {
      try {
        const prompt = BLUEPRINT_PROMPTS[type](idea, verdict || '');
        const modelRes = await callGemini({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          temperature: 0.3,
          maxOutputTokens: 2048,
        });

        const text = modelRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseModelJson(text);
          if (parsed?.data && (parsed.data.title || parsed.data.weeks || parsed.data.checklist || parsed.data.icps)) {
            resultData = parsed.data;
            source = 'live';
          }
        }
      } catch (err) {
        console.warn('[api/idea-validator/followup] model call degraded to deterministic fallback:', err.message);
      }
    }

    return NextResponse.json({
      ok: true,
      data: resultData,
      meta: { source, feature: 'idea-validator-blueprint', type },
    });
  } catch (error) {
    console.error('[api/idea-validator/followup] error:', error);
    return NextResponse.json({ error: { message: error.message || 'Failed to generate follow-up' } }, { status: 500 });
  }
}
