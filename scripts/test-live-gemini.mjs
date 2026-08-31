import { callGemini } from '../lib/ai/gemini.js';
import { runAi } from '../lib/ai/gateway.js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('Testing Live Gemini AI Synthesis...');
try {
  const result = await runAi({
    feature: 'idea-validator',
    input: { idea: 'An automated GST reconciliation SaaS that cross-references GSTR-2B with Tally ERP for Indian MSMEs' },
    forceLive: true,
  });

  console.log('Source:', result.meta.source);
  console.log('Validation Score:', result.data.validationScore);
  console.log('Verdict:', result.data.verdict);
  console.log('AI Meta:', result.meta);
} catch (err) {
  console.error('Error:', err);
}
