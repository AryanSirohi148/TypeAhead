'use strict';

const { generateDataset } = require('./generateDataset');

// Database Seed Script
// generates dataset and bulk inserts it
// runs automatically on first start when data store is empty.
//
// if you want to reset:
// 1. delete backend/data/queries.json
// 2. run npm run dev again

function seedDatabase(store) {
  const t0      = Date.now();
  const queries = generateDataset();

  console.log(`[Seed] Generated ${queries.length.toLocaleString()} queries. Inserting into DataStore...`);

  store.bulkInsert(queries);
  store.save(); // persist to disk immediately

  const elapsed    = Date.now() - t0;
  const finalCount = store.countAll();

  console.log(`[Seed] Done: ${finalCount.toLocaleString()} rows stored (${elapsed}ms).`);
  return finalCount;
}

// Allow running directly: node scripts/seed.js
if (require.main === module) {
  const store = require('../src/db/database');
  seedDatabase(store);
}

module.exports = { seedDatabase };
