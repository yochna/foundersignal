/**
 * JSON hardening for model output.
 *
 * LLMs wrap JSON in prose, fence it in markdown, use single quotes, add trailing
 * commas and occasionally truncate mid-object. Each repair below is cheap and
 * strictly increases the chance of recovering usable data before we give up and
 * fall back to heuristics.
 */

/** Strip markdown fences and any prose surrounding the JSON body. */
function stripFences(text) {
  let out = String(text || '').trim();

  const fenced = out.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenced) out = fenced[1].trim();

  // Some models prefix with "Here is the JSON:".
  const firstBrace = out.search(/[[{]/);
  if (firstBrace > 0) out = out.slice(firstBrace);

  return out.trim();
}

/**
 * Extract the outermost balanced JSON value, ignoring braces inside strings.
 * More reliable than a greedy regex when the model appends commentary.
 */
function extractBalanced(text) {
  const start = text.search(/[[{]/);
  if (start === -1) return null;

  const closers = { '{': '}', '[': ']' };
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{' || char === '[') {
      stack.push(closers[char]);
    } else if (char === '}' || char === ']') {
      stack.pop();
      if (stack.length === 0) return text.slice(start, i + 1);
    }
  }

  if (stack.length === 0) return null;

  // Truncated response: close the unterminated string, drop the dangling
  // key or comma, then close every open container innermost-first. This
  // recovers whichever fields did arrive instead of discarding the whole reply.
  let repaired = text.slice(start);
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*("[^"]*"\s*:?\s*)?$/, '');

  return repaired + stack.reverse().join('');
}

function relaxSyntax(text) {
  return (
    text
      // Smart quotes, which some models emit around keys and string values.
      .replace(/[\u201C\u201D]/g, '"')
      // Trailing commas before a closing brace or bracket.
      .replace(/,\s*([}\]])/g, '$1')
      // Unquoted object keys.
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      // Python-style literals.
      .replace(/:\s*None\b/g, ': null')
      .replace(/:\s*True\b/g, ': true')
      .replace(/:\s*False\b/g, ': false')
      // Literal newlines inside string values break JSON.parse.
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => match.replace(/\n/g, '\\n'))
  );
}

/**
 * Convert Python/JS-style single-quoted keys and values to JSON strings.
 *
 * Last resort only: an apostrophe inside prose would corrupt the value, so this
 * runs after every quote-preserving strategy has already failed.
 */
function requote(text) {
  return text
    .replace(/([{,[]\s*)'([^'\n]*)'(\s*:)/g, '$1"$2"$3')
    .replace(/([:,[]\s*)'([^'\n]*)'(\s*[,}\]\n])/g, '$1"$2"$3');
}

/**
 * Parse model output into a JS value.
 * Returns { ok, value, strategy } so callers can log how much repair was needed.
 */
export function parseModelJson(raw) {
  if (raw === null || raw === undefined) {
    return { ok: false, error: 'empty response' };
  }
  if (typeof raw === 'object') {
    return { ok: true, value: raw, strategy: 'already-object' };
  }

  const cleaned = stripFences(raw);
  if (!cleaned) return { ok: false, error: 'no JSON content found' };

  const attempts = [
    { strategy: 'direct', text: cleaned },
    { strategy: 'balanced', text: extractBalanced(cleaned) },
    { strategy: 'relaxed', text: relaxSyntax(cleaned) },
    { strategy: 'balanced+relaxed', text: relaxSyntax(extractBalanced(cleaned) || '') },
    { strategy: 'requoted', text: relaxSyntax(requote(extractBalanced(cleaned) || cleaned)) },
  ];

  for (const attempt of attempts) {
    if (!attempt.text) continue;
    try {
      const value = JSON.parse(attempt.text);
      if (value !== null && typeof value === 'object') {
        return { ok: true, value, strategy: attempt.strategy };
      }
    } catch {
      // Try the next strategy.
    }
  }

  return { ok: false, error: 'could not parse JSON after all repair attempts' };
}

export default parseModelJson;
