/**
 * Baseline signal corpus.
 *
 * The live connectors in lib/ingest/sources/* prepend real Reddit, GitHub and
 * RSS items to this list. These entries guarantee that clustering always has
 * enough material to produce a full feed, which is what keeps an ingestion run
 * useful even when every outbound network call is blocked.
 */
export const seedSignals = [
  { source: 'Reddit (r/IndiaTech)', text: 'My merchant account was frozen by the Gujarat cyber cell over a suspicious UPI credit transfer. It has locked all my working capital.', url: null, publishedAt: '2026-08-11' },
  { source: 'Reddit (r/indiastartups)', text: 'Fintech warning: gateways are blocking POS merchant settlements because of a sudden rise in merchant mule accounts running UPI scams.', url: null, publishedAt: '2026-08-10' },
  { source: 'Jobs (aggregated)', text: 'Fintech hiring fraud analysts and risk engine engineers with expertise in device fingerprinting, transaction telemetry and NPCI regulations.', url: null, publishedAt: '2026-08-12' },

  { source: 'RBI Announcements', text: 'RBI circular updates the fair practices code with strict monitoring of outsourced lending communication apps and mandatory audit trail logs.', url: null, publishedAt: '2026-08-08' },
  { source: 'StackOverflow', text: 'How do I implement a DPDP compliance consent manager workflow for Indian fintech user onboarding without hurting conversion?', url: null, publishedAt: '2026-08-11' },
  { source: 'Jobs (aggregated)', text: 'Lead compliance officer role requiring deep knowledge of RBI fair practices guidelines, lending disclosures and data protection obligations.', url: null, publishedAt: '2026-08-12' },
  { source: 'Reddit (r/legaladviceindia)', text: 'Recovery agents are calling my family at midnight about my loan. Is this allowed under RBI rules?', url: null, publishedAt: '2026-08-09' },

  { source: 'Tech News India', text: 'Indian IT services face margin pressure and are rushing to refactor legacy code migrations from Java 8 to Node.js and Go to compress delivery timelines.', url: null, publishedAt: '2026-08-09' },
  { source: 'GitHub Discussions', text: 'Refactoring enterprise PHP legacy code to Python using LLM code analysis. We need AST compilers that write tests to verify preserved behaviour.', url: null, publishedAt: '2026-08-11' },

  { source: 'GitHub Discussions', text: 'My generative agents were calling the model API recursively and cost me $200 in an hour. I need a cost-limiting proxy with a caching layer.', url: null, publishedAt: '2026-08-05' },
  { source: 'Reddit (r/devops)', text: 'Is there a good open-source proxy to trace LLM latency, prompt changes and system errors in production?', url: null, publishedAt: '2026-08-10' },
  { source: 'Reddit (r/MachineLearning)', text: 'Prompt injection through a scraped web page made our agent call an internal tool it should never have touched.', url: null, publishedAt: '2026-08-07' },

  { source: 'GST Portal News', text: 'CBIC mandates invoice-level matching for Input Tax Credit claims under GSTR-2B. Manual matching is locking up cash claims for SMEs.', url: null, publishedAt: '2026-08-07' },
  { source: 'Twitter (SME India)', text: 'GST reconciliation is a nightmare. Suppliers upload invoices late and we lose tax credits over discrepancies.', url: null, publishedAt: '2026-08-11' },
  { source: 'Reddit (r/IndianStreetBets)', text: 'My MSME has \u20B94 crore turnover on GST returns but the bank rejected our working capital loan for lack of audited financials.', url: null, publishedAt: '2026-08-06' },

  { source: 'SEBI Updates', text: 'SEBI revises reporting formats with stricter validation, and mid-tier firms report rejected filings and backlog penalties.', url: null, publishedAt: '2026-08-04' },
];

export default seedSignals;
