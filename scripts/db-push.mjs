import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

/**
 * Applies supabase/migrations/*.sql to the project in SUPABASE_DB_URL.
 *
 * The alternative documented in the README is pasting the SQL into the Supabase
 * SQL editor by hand; this exists so a fresh project can be brought up from the
 * checkout instead. Every migration is guarded with IF NOT EXISTS / DROP-CREATE,
 * so re-running is a no-op rather than an error.
 *
 * Usage: npm run db:push
 *
 * SUPABASE_DB_URL is the connection string from Supabase -> Connect. Prefer the
 * pooler host: the direct db.<ref>.supabase.co host is IPv6-only, which most
 * home and CI networks cannot reach.
 */

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error(
    'SUPABASE_DB_URL is not set. Copy the pooler connection string from\n' +
      'Supabase -> Connect -> Session pooler into .env.local, URL-encoding any\n' +
      'reserved characters in the password (# -> %23, ? -> %3F, @ -> %40).'
  );
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

if (files.length === 0) {
  console.error(`No .sql files found in ${migrationsDir}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
  statement_timeout: 120_000,
});

try {
  await client.connect();
} catch (error) {
  console.error(`Could not connect: ${error.message}`);
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), 'utf8');
  const started = Date.now();
  try {
    await client.query(sql);
    console.log(`  applied  ${file} (${Date.now() - started}ms)`);
  } catch (error) {
    failed = true;
    console.error(`  FAILED   ${file}: ${error.message}`);
    break;
  }
}

if (!failed) {
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log(`\npublic schema now has ${rows.length} tables: ${rows.map((r) => r.table_name).join(', ')}`);
}

await client.end();
process.exit(failed ? 1 : 0);
