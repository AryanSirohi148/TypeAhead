'use strict';

// Trending Score logic
//
// we want to rank recent searches higher than old viral ones.
// formula: count * e^(-0.1 * hours_ago)
// so a search from right now keeps its full count score.
// a search from yesterday drops to like 9% of its score.

const LAMBDA         = 0.1;  // decay rate per hour
const SEED_AGE_HOURS = 168;  // 1 week — default age for seed-only data

class TrendingService {
  constructor(store) {
    this.store = store;
  }

  computeScore(count, lastSearched) {
    const hoursAgo = lastSearched && lastSearched > 0
      ? (Date.now() / 1000 - lastSearched) / 3600
      : SEED_AGE_HOURS;

    const decay = Math.exp(-LAMBDA * Math.max(0, hoursAgo));
    return count * decay;
  }

  getTopTrending(limit = 10) {
    return this.store.getTopTrending(limit).map(r => ({
      query        : r.query,
      count        : r.count,
      trendingScore: parseFloat(r.trendingScore.toFixed(2)),
      lastSearched : new Date(r.lastSearched * 1000).toISOString(),
    }));
  }

  // recalculate all scores (runs every 5 mins from index.js)
  recomputeAll() {
    let updated = 0;
    for (const row of this.store.getAllRows()) {
      if (row.lastSearched > 0) {
        this.store.updateTrendingScore(row.query, this.computeScore(row.count, row.lastSearched));
        updated++;
      }
    }
    console.log(`[Trending] Recomputed scores for ${updated} queries.`);
  }
}

module.exports = { TrendingService };
