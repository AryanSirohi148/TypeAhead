'use strict';

// GET /suggest?q=<prefix>
// checks cache first, then falls back to Trie (which is also in memory).

function createSuggestRoute(trie, cache, stats) {
  return (req, res) => {
    const start  = Date.now();
    const prefix = (req.query.q || '').trim().toLowerCase();

    // --- Cache lookup ---
    const cached = cache.get(prefix);
    if (cached !== null) {
      const ms = Date.now() - start;
      stats.recordLatency(ms);
      return res.json({
        prefix,
        suggestions: cached,
        meta: { cacheHit: true, latencyMs: ms, node: cache.getNodeForKey(prefix) },
      });
    }

    // --- Trie lookup (cache miss) ---
    const raw = trie.search(prefix);
    const suggestions = raw.map(s => ({
      query: s.query,
      count: s.count,
      score: parseFloat(s.score.toFixed(2)),
    }));

    // Store in cache so the next identical prefix is a HIT
    cache.set(prefix, suggestions);
    stats.dbReads++;

    const ms = Date.now() - start;
    stats.recordLatency(ms);

    return res.json({
      prefix,
      suggestions,
      meta: { cacheHit: false, latencyMs: ms, node: cache.getNodeForKey(prefix) },
    });
  };
}

module.exports = { createSuggestRoute };
