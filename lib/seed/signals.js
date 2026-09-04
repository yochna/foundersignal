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

  { source: 'Reddit (r/realestate_india)', text: 'Our RERA escrow withdrawal got flagged because the bank wanted a fresh construction progress certificate before releasing funds. Nobody warned us this rule tightened.', url: null, publishedAt: '2026-08-13' },
  { source: 'Jobs (aggregated)', text: 'Developer group hiring a RERA compliance manager to handle quarterly disclosures and escrow reconciliation across five ongoing projects.', url: null, publishedAt: '2026-08-10' },

  { source: 'Reddit (r/logisticsindia)', text: 'We hired a delivery rider who used a fake previous-employer reference. No easy way to run a police verification background check fast enough for same-day onboarding.', url: null, publishedAt: '2026-08-12' },
  { source: 'Jobs (aggregated)', text: 'Quick-commerce operator hiring a trust and safety lead to build background verification into the gig onboarding flow using DigiLocker eKYC.', url: null, publishedAt: '2026-08-09' },

  { source: 'GitHub Discussions', text: 'We found a shadow API in our fintech microservices exposing customer PAN numbers with no rate limiting. CERT-In reporting window is only 6 hours once discovered.', url: null, publishedAt: '2026-08-11' },
  { source: 'Reddit (r/devops)', text: 'Our appsec team cannot keep up with API sprawl across 60 microservices. We need continuous API security posture monitoring, not annual pentests.', url: null, publishedAt: '2026-08-08' },

  { source: 'Twitter (D2C founders)', text: 'Found three counterfeit listings of our product on a marketplace using our exact trademark. Filing a takedown notice manually takes a week.', url: null, publishedAt: '2026-08-10' },
  { source: 'Reddit (r/IndiaStartups)', text: 'ONDC seller onboarding is so fast that trademark-infringing sellers are popping up faster than we can file IP infringement complaints.', url: null, publishedAt: '2026-08-07' },

  { source: 'Reddit (r/electricvehicles)', text: 'App showed the charging station as available but it was broken for the third time this month. EV charging uptime reporting is basically fiction.', url: null, publishedAt: '2026-08-12' },
  { source: 'Jobs (aggregated)', text: 'EV charge point operator hiring an OCPP integration engineer to build real-time charger status and billing reconciliation monitoring.', url: null, publishedAt: '2026-08-09' },

  { source: 'Jobs (aggregated)', text: 'Engineering college hiring a training and placement officer with employability analytics experience to reduce at-risk-student surprises before placement season.', url: null, publishedAt: '2026-08-08' },
  { source: 'Reddit (r/developersIndia)', text: 'Our tier-3 college only finds out which students are placement-ready in the final semester, by which point remediation is basically impossible.', url: null, publishedAt: '2026-08-06' },

  { source: 'Tech News India', text: 'Real-money gaming platform pulled from a state after regulators ruled a game format illegal there, reigniting debate over state-by-state gaming compliance.', url: null, publishedAt: '2026-08-11' },
  { source: 'Jobs (aggregated)', text: 'Gaming platform hiring gaming compliance counsel to track state-wise online gaming rules and responsible gaming self-exclusion requirements.', url: null, publishedAt: '2026-08-07' },

  { source: 'Twitter (Sustainability India)', text: 'Our EPR plastic credit filing is due and half the recycling certificates we sourced turned out to be duplicates. CPCB compliance is a mess of broker networks.', url: null, publishedAt: '2026-08-10' },
  { source: 'Jobs (aggregated)', text: 'FMCG brand hiring an EPR and sustainability compliance manager to handle CPCB plastic waste credit sourcing and annual filings.', url: null, publishedAt: '2026-08-08' },
];

export default seedSignals;
