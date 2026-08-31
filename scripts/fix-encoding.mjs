/**
 * Repairs source files that were written with Windows-1252 single-byte
 * characters instead of UTF-8 multibyte sequences (typographic dashes,
 * ellipses, the rupee sign). The Next.js/SWC loader rejects such files with
 * "stream did not contain valid UTF-8".
 *
 * Only files that fail a strict UTF-8 decode are touched, so running this
 * repeatedly is safe.
 *
 * Usage: node scripts/fix-encoding.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.data', '.vercel', 'out']);
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.md', '.sql', '.txt']);

// Windows-1252 assigns printable characters to 0x80-0x9F, where Latin-1 has
// control codes. Everything outside this range matches Latin-1.
const CP1252_HIGH = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8a: '\u0160',
  0x8b: '\u2039', 0x8c: '\u0152', 0x8e: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9a: '\u0161', 0x9b: '\u203A', 0x9c: '\u0153',
  0x9e: '\u017E', 0x9f: '\u0178',
};

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function isValidUtf8(buffer) {
  try {
    utf8Decoder.decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function decodeCp1252(buffer) {
  let out = '';
  for (const byte of buffer) {
    if (byte < 0x80) out += String.fromCharCode(byte);
    else out += CP1252_HIGH[byte] ?? String.fromCharCode(byte);
  }
  return out;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

let fixed = 0;
let scanned = 0;

for (const file of walk(ROOT)) {
  scanned += 1;
  const buffer = fs.readFileSync(file);
  if (isValidUtf8(buffer)) continue;

  fs.writeFileSync(file, decodeCp1252(buffer), 'utf8');
  fixed += 1;
  console.log(`fixed: ${path.relative(ROOT, file)}`);
}

console.log(`\nScanned ${scanned} files, re-encoded ${fixed}.`);
