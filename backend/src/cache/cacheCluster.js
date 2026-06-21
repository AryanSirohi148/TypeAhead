'use strict';

// Distributed In-Memory Cache Cluster
// simulates 3 cache nodes. consistent hashing decides which node gets which prefix.
// each node has LRU eviction and 60s TTL so things don't get stale

const { ConsistentHashRing } = require('./consistentHash');

const TTL_SECONDS  = 60;   // cache entries expire after 1 minute
const MAX_ENTRIES  = 500;  // LRU cap per node

class CacheNode {
  constructor(name) {
    this.name      = name;
    this.store     = new Map(); // key → { results, createdAt, expiresAt }
    this.hits      = 0;
    this.misses    = 0;
    this.evictions = 0;
  }

  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    // LRU: move to tail of the Map by deleting + re-inserting
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.results;
  }

  set(key, results) {
    // LRU eviction: if at capacity, remove the oldest (head of Map)
    if (this.store.size >= MAX_ENTRIES) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
      this.evictions++;
    }

    this.store.set(key, {
      results,
      createdAt: Date.now(),
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  // invalidates all cached keys starting with the given prefix
  // used when batch flush updates scores so cache isn't serving old data
  invalidateByPrefix(prefix) {
    const lp = prefix.toLowerCase();
    let count = 0;
    for (const key of this.store.keys()) {
      if (key === lp || lp.startsWith(key) || key.startsWith(lp)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  // snapshot for the debug endpoint
  inspect(key) {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return {
      exists      : true,
      ttlRemaining: Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)),
      cachedAt    : new Date(entry.createdAt).toISOString(),
      resultCount : entry.results.length,
    };
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      name     : this.name,
      entries  : this.store.size,
      hits     : this.hits,
      misses   : this.misses,
      hitRate  : total > 0 ? parseFloat((this.hits / total * 100).toFixed(1)) : 0,
      evictions: this.evictions,
    };
  }
}

class CacheCluster {
  constructor(nodeNames) {
    this.nodes = new Map();
    for (const name of nodeNames) {
      this.nodes.set(name, new CacheNode(name));
    }
    this.ring = new ConsistentHashRing(nodeNames);

    const dist = this.ring.getDistribution();
    console.log('[CacheCluster] Consistent hash ring initialised.');
    console.log('[CacheCluster] Virtual-node distribution:', dist);
    console.log(`[CacheCluster] Total ring points: ${this.ring.getRingSize()}\n`);
  }

  _getNode(key) {
    const name = this.ring.getNode(key);
    return this.nodes.get(name);
  }

  get(key) {
    return this._getNode(key).get(key);
  }

  set(key, results) {
    this._getNode(key).set(key, results);
  }

  // invalidate all prefixes of a query
  // e.g. "iphone" -> delete "i", "ip", "iph" etc from whichever node has them
  invalidateForQuery(query) {
    const q = query.toLowerCase();
    for (let i = 1; i <= q.length; i++) {
      const prefix = q.slice(0, i);
      this._getNode(prefix).delete(prefix);
    }
  }

  getNodeForKey(key) {
    return this.ring.getNode(key);
  }

  getNodeInfo(key) {
    const nodeName = this.ring.getNode(key);
    return { nodeName, node: this.nodes.get(nodeName) };
  }

  getAllStats() {
    const nodeStats   = Array.from(this.nodes.values()).map(n => n.getStats());
    const totalHits   = nodeStats.reduce((s, n) => s + n.hits,   0);
    const totalMisses = nodeStats.reduce((s, n) => s + n.misses, 0);
    const total       = totalHits + totalMisses;

    return {
      nodes  : nodeStats,
      overall: {
        hits   : totalHits,
        misses : totalMisses,
        hitRate: total > 0 ? parseFloat((totalHits / total * 100).toFixed(1)) : 0,
      },
    };
  }
}

module.exports = { CacheCluster };
