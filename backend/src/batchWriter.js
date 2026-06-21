'use strict';

// Batch Write Buffer
//
// instead of hitting the db for every single search (which would crash it under load),
// we just hold them in memory and write them all at once every 5 seconds.
// if 1000 people search "iphone", that's just 1 write instead of 1000.
//
// downside: if the server crashes we lose up to 5 seconds of search counts,
// but for a typeahead that's fine.

const FLUSH_INTERVAL_MS = 5000; // flush every 5 seconds
const FLUSH_BATCH_SIZE  = 100;  // also flush if buffer fills up

class BatchWriter {
  constructor(store, trie, cache, trending) {
    this.store    = store;
    this.trie     = trie;
    this.cache    = cache;
    this.trending = trending;
    this.buffer   = [];
    this.timer    = null;

    this.stats = {
      totalSubmissions: 0,
      totalFlushes    : 0,
      totalDbWrites   : 0,
      totalSaved      : 0,
      lastFlushAt     : null,
      lastFlushMs     : 0,
    };
  }

  // add search to buffer. flush early if it gets too full
  submit(query) {
    const q = query.toLowerCase().trim();
    if (!q) return;
    this.buffer.push({ query: q, ts: Math.floor(Date.now() / 1000) });
    this.stats.totalSubmissions++;
    if (this.buffer.length >= FLUSH_BATCH_SIZE) this.flush();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    console.log(`[BatchWriter] Started — flush every ${FLUSH_INTERVAL_MS}ms or ${FLUSH_BATCH_SIZE} items.`);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.flush();
    console.log('[BatchWriter] Stopped and final flush done.');
  }

  flush() {
    if (this.buffer.length === 0) return;

    // Atomically drain the buffer
    const batch = this.buffer.splice(0);
    const t0    = Date.now();

    // ---- Aggregate: collapse duplicate queries ----
    const agg = new Map(); // query → { count, latestTs }
    for (const item of batch) {
      const prev = agg.get(item.query) || { count: 0, latestTs: 0 };
      agg.set(item.query, {
        count   : prev.count + 1,
        latestTs: Math.max(prev.latestTs, item.ts),
      });
    }

    const uniqueQueries = agg.size;
    const saved         = batch.length - uniqueQueries;

    // ---- Write to DataStore + update Trie + invalidate cache ----
    for (const [query, { count, latestTs }] of agg) {
      // 1. Upsert into in-memory store
      const row = this.store.upsert(query, count, latestTs);

      // 2. Recompute trending score
      const score = this.trending.computeScore(row.count, row.lastSearched);
      this.store.updateTrendingScore(query, score);

      // 3. Sync Trie with new score
      this.trie.update(query, score, row.count);

      // 4. Bust any cached prefix results for this query
      this.cache.invalidateForQuery(query);
    }

    // 5. Schedule async disk save (debounced, non-blocking)
    this.store.scheduleSave();

    // ---- Stats ----
    const elapsed = Date.now() - t0;
    this.stats.totalFlushes++;
    this.stats.totalDbWrites += uniqueQueries;
    this.stats.totalSaved    += saved;
    this.stats.lastFlushAt    = new Date().toISOString();
    this.stats.lastFlushMs    = elapsed;

    console.log(
      `[BatchWriter] Flushed ${batch.length} submissions → ` +
      `${uniqueQueries} unique store writes (saved ${saved}) in ${elapsed}ms`
    );
  }

  getStats() {
    const sub = this.stats.totalSubmissions;
    return {
      ...this.stats,
      buffered     : this.buffer.length,
      reductionRate: sub > 0
        ? parseFloat((this.stats.totalSaved / sub * 100).toFixed(1))
        : 0,
    };
  }
}

module.exports = { BatchWriter };
