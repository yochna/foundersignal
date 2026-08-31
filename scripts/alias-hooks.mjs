import { pathToFileURL } from 'node:url';
import path from 'node:path';

/**
 * ESM resolve hook that teaches plain `node` the `@/*` alias from jsconfig.json.
 *
 * Next.js resolves that alias through webpack, so the lib/ modules use it
 * everywhere. This hook lets the same modules be imported by the CLI without
 * duplicating them or adding a bundler step.
 */

const root = process.cwd();
const EXTENSIONS = ['', '.js', '.mjs', '.jsx', '/index.js'];

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = path.join(root, specifier.slice(2));
    const fs = await import('node:fs');

    for (const extension of EXTENSIONS) {
      const candidate = base + extension;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }

    throw new Error(`Could not resolve alias "${specifier}" under ${root}`);
  }

  return nextResolve(specifier, context);
}
