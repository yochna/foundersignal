/**
 * Builder Match diagnostic. Ported from the original MVP so scoring semantics
 * stay comparable, with an added "stage" question the LLM prompt uses to size
 * the recommended MVP.
 */
export const builderQuestions = [
  {
    id: 'q-skills',
    questionText: 'What is your primary functional skillset?',
    helper: 'Pick the hat you wear most days, not the one you aspire to.',
    options: [
      { text: 'Engineering / software development', value: 'tech' },
      { text: 'Product management / strategy', value: 'product' },
      { text: 'Sales / business development / operations', value: 'sales' },
      { text: 'Compliance / legal / risk auditing', value: 'compliance' },
    ],
  },
  {
    id: 'q-domain',
    questionText: 'Which business vertical do you know best?',
    helper: 'Domain familiarity is the strongest predictor of a fast first customer.',
    options: [
      { text: 'Software development and IT services', value: 'IT' },
      { text: 'Banking and lending (NBFC)', value: 'BFSI' },
      { text: 'Payments, UPI and fintech rails', value: 'BFSI' },
      { text: 'General SaaS and enterprise tools', value: 'IT' },
    ],
  },
  {
    id: 'q-capital',
    questionText: 'What starting capital can you commit?',
    helper: 'Be honest here; it changes which opportunities are actually reachable.',
    options: [
      { text: 'Bootstrapped (under \u20B950k, sweat equity only)', value: 'low' },
      { text: 'Moderate (\u20B91L - \u20B95L, can hire freelancers)', value: 'mid' },
      { text: 'Significant (\u20B95L+, can fund runway and infrastructure)', value: 'high' },
    ],
  },
  {
    id: 'q-time',
    questionText: 'How much time can you commit?',
    helper: 'Regulated markets need sustained attention rather than weekend bursts.',
    options: [
      { text: 'Part-time side project (10-20 hrs/week)', value: 'side' },
      { text: 'Full-time commitment (40+ hrs/week)', value: 'full' },
    ],
  },
  {
    id: 'q-risk',
    questionText: 'What is your regulatory risk appetite?',
    helper: 'Regulatory complexity is a moat, but only if you can survive it.',
    options: [
      { text: 'Low: prefer simple B2B SaaS with no regulatory exposure', value: 'low' },
      { text: 'High: willing to tackle RBI/SEBI markets for a durable moat', value: 'high' },
    ],
  },
];

export default builderQuestions;
