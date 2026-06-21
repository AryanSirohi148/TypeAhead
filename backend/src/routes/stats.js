'use strict';

// GET /stats
// returns cache hit rates, p95 latencies, and batch writer stats.

function createStatsRoute(stats, cache, batchWriter, trie) {
  return (req, res) => {
    const cacheStats = cache.getAllStats();
    const batchStats = batchWriter.getStats();
    const trieStats  = trie.getStats();

    return res.json({
      cache: cacheStats,
      latency: {
        p50         : stats.getPercentile(50),
        p95         : stats.getPercentile(95),
        p99         : stats.getPercentile(99),
        avg         : stats.getAverage(),
        sampleSize  : stats.latencies.length,
      },
      database: {
        reads : stats.dbReads,
        writes: batchStats.totalDbWrites,
      },
      batchWriter: batchStats,
      trie       : trieStats,
    });
  };
}

module.exports = { createStatsRoute };
