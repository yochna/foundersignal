import { repo, describeStore } from '@/lib/db';
import { normalizeOpportunity } from '@/lib/schemas';
import { fullSeedOpportunities as seedOpportunities } from '@/lib/seed/opportunities';

/**
 * Writes the bundled briefs into whichever store is configured.
 *
 * The file driver seeds itself on first read, but a fresh Supabase project
 * starts empty. loadOpportunities() falls back to the seed so the Radar is never
 * blank, which hides the fact that saving a watchlist entry would then violate
 * the foreign key from saved_opportunities to opportunities. Seeding the table
 * closes that gap until the first real ingestion run replaces these rows.
 *
 * Usage: npm run db:seed
 */

const store = await describeStore();
console.log(`store: ${store.driver} (configured: ${store.configured}, writable: ${store.writable})`);

if (store.degraded) {
  console.error(`Supabase is degraded, refusing to seed: ${store.degraded.message}`);
  process.exit(1);
}

const rows = seedOpportunities
  .map((opp) => normalizeOpportunity({ ...opp, source: 'seed' }))
  .filter(Boolean);

const written = await repo.upsertOpportunities(rows);
const after = await repo.listOpportunities();

console.log(`upserted ${written} opportunities; the store now holds ${after.length}.`);
process.exit(0);
