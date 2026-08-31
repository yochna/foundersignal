import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Preloaded with `node --import` before any CLI entry point.
 *
 * Two jobs, both of which Next normally does for us:
 *   1. Register the `@/*` resolve hook.
 *   2. Load .env.local / .env so lib/config.js sees the same values the app does.
 */

register('./alias-hooks.mjs', import.meta.url);

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Strip matching quotes, then unescape newlines inside double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, '\n');
    }

    if (key) values[key] = value;
  }
  return values;
}

// Same precedence Next uses: .env.local wins over .env, and a value already in
// the real environment always wins over both.
for (const file of ['.env.local', '.env']) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  try {
    const values = parseEnv(fs.readFileSync(filePath, 'utf8'));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    console.warn(`[cli] could not read ${file}: ${error.message}`);
  }
}
