import http from 'node:http';

/**
 * Stands in for the Gemini endpoint so the gateway's live, repair and refusal
 * branches can be exercised without a real key or quota. Scenario is chosen with
 * the SCENARIO env var.
 */

const scenario = process.env.SCENARIO || 'good';
const port = Number(process.env.PORT || 4321);

const GOOD = {
  validationScore: 76,
  verdict: 'promising',
  scores: { demand: 80, competition: 55, feasibility: 70, timing: 82, indiaRelevance: 88, regulation: 60 },
  summary: 'Strong regulatory tailwind and a clear willingness to pay among mid-market NBFCs.',
  gaps: ['No incumbent owns reconciliation for sub-crore turnover firms'],
  competitors: [{ name: 'ClearTax', note: 'Strong in filing, weak in reconciliation' }],
  mvpBuild: 'Start with a GSTR-2B vs purchase register matcher and a single bank integration.',
  monetization: 'Per-GSTIN monthly subscription with a per-notice success fee.',
  risks: ['GSTN API access requires a GSP partnership'],
  nextSteps: ['Interview 10 CAs serving MSME clients'],
  relatedOpportunityIds: ['bfsi-ai-compliance'],
};

const bodies = {
  good: () => JSON.stringify(GOOD),
  fenced: () => '```json\n' + JSON.stringify(GOOD, null, 2) + '\n```',
  chatty: () => 'Certainly! Here is my analysis:\n' + JSON.stringify(GOOD) + '\nLet me know if you need more.',
  truncated: () => JSON.stringify(GOOD).slice(0, 220),
  garbage: () => 'I am unable to assist with that request.',
  empty: () => '{}',
};

const server = http.createServer(async (req, res) => {
  const send = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  // Drain the request body so the client sees a clean response.
  for await (const _chunk of req) void _chunk;

  if (scenario === 'rate-limit') {
    return send(429, { error: { code: 429, message: 'Resource has been exhausted', status: 'RESOURCE_EXHAUSTED' } });
  }
  if (scenario === 'bad-key') {
    return send(400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } });
  }
  if (scenario === 'server-error') {
    return send(503, { error: { code: 503, message: 'The model is overloaded', status: 'UNAVAILABLE' } });
  }
  if (scenario === 'hang') {
    return; // never responds: exercises the client timeout
  }
  if (scenario === 'html') {
    res.writeHead(502, { 'Content-Type': 'text/html' });
    return res.end('<html><body>502 Bad Gateway</body></html>');
  }

  const text = (bodies[scenario] || bodies.good)();
  return send(200, {
    candidates: [{ content: { parts: [{ text }] }, finishReason: scenario === 'truncated' ? 'MAX_TOKENS' : 'STOP' }],
    usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 400, totalTokenCount: 1300 },
  });
});

server.listen(port, () => console.log(`[stub] scenario=${scenario} listening on ${port}`));
