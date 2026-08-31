import fs from 'fs';
const clusterFile = fs.readFileSync('lib/ingest/cluster.js', 'utf8');
const seedFile = fs.readFileSync('lib/seed/opportunities.js', 'utf8') + '\n\n' + fs.readFileSync('lib/seed/opportunities-extra.js', 'utf8');

// Cluster IDs use single quotes: id: 'bfsi-ai-compliance'
const clusterMatches = [...clusterFile.matchAll(/id:\s*'([^']+)'/g)];
const clusterIds = [...new Set(clusterMatches.map(m => m[1]))];

// Seed IDs use JSON format: "id": "bfsi-ai-compliance"
const seedMatches = [...seedFile.matchAll(/"id":\s*"([^"]+)"/g)];
const seedIds = [...new Set(seedMatches.map(m => m[1]))];

console.log('Cluster IDs (' + clusterIds.length + '):');
clusterIds.forEach(id => console.log('  ' + id));
console.log('\nSeed IDs (' + seedIds.length + '):');
seedIds.forEach(id => console.log('  ' + id));
console.log('\nClusters without seed briefs:', clusterIds.filter(c => !seedIds.includes(c)).length);
console.log('Seed briefs not in clusters:', seedIds.filter(s => !clusterIds.includes(s)).length);
