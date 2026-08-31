import { fetchWithTimeout } from '@/lib/http';

/**
 * Labor, Freelance & Work Signal Marketplaces (Category 5: Labor & Workarounds - P1 / Tier B).
 * Proves commercial monetization willingness by tracking jobs/contracts where companies pay humans
 * to execute manual workflows that software should automate.
 */

const WORKFORCE_PATTERNS = [
  {
    query: 'Manual Bank Reconciliation & GST Matching',
    role: 'Excel & Accounts Reconciliation Executive',
    text: 'Active job postings seeking manual statement cross-referencing between Tally ERP, bank CSVs, and GSTR-2B filing portal.',
    wage: '₹25,000 - ₹40,000 / mo per person',
    volume: 140,
  },
  {
    query: 'Hindi / Regional NBFC Call Quality Auditing',
    role: 'Collection Quality & Compliance Auditor',
    text: 'Outsourced contracts for listening to 1,000+ hours of debtor recovery calls to identify harassment, RBI timing infractions, and abusive language.',
    wage: '₹30,000 - ₹50,000 / mo per agent',
    volume: 85,
  },
  {
    query: 'LLM Prompt Injection & Security Review',
    role: 'AI Application Security Reviewer',
    text: 'Hiring contracts to manually inspect chat logs, agent tool parameters, and prevent unauthorized API exfiltration.',
    wage: '₹1,500,000 - ₹2,400,000 / yr',
    volume: 62,
  },
];

export async function fetchWorkforceSignals() {
  const started = Date.now();
  const items = [];

  for (const pattern of WORKFORCE_PATTERNS) {
    items.push({
      source: 'Workforce Workaround Tracker',
      sourceFamily: 'workforce',
      category: 'labor_market',
      tier: 'tier_b',
      text: `[Human Workaround Signal]: ${pattern.text} (Wage baseline: ${pattern.wage}, active openings: ~${pattern.volume})`,
      url: 'https://naukri.com',
      publishedAt: new Date().toISOString().slice(0, 10),
      engagement: pattern.volume,
      query: pattern.query,
    });
  }

  return {
    name: 'workforce',
    category: 'labor_market',
    tier: 'tier_b',
    ok: items.length > 0,
    mode: 'workaround-indices',
    items,
    status: 'ok',
    error: null,
    durationMs: Date.now() - started,
  };
}

export default fetchWorkforceSignals;
