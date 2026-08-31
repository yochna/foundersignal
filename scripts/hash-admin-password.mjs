#!/usr/bin/env node
/**
 * Generates the value to put in ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs "your-new-password"
 *
 * Prints a "salt:hash" string (both hex, scrypt with a random 16-byte salt).
 * Paste the printed value into ADMIN_PASSWORD_HASH in your .env.local and in
 * your Vercel project's environment variables, then redeploy. The plaintext
 * password is never stored anywhere — only this derived value.
 */
import { scryptSync, randomBytes } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "your-new-password"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Pick a password with at least 8 characters.');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');

console.log('\nAdd this to your .env.local and Vercel env vars as ADMIN_PASSWORD_HASH:\n');
console.log(`${salt}:${hash}`);
console.log('\nThen sign in with your admin email and the password you just typed above.\n');