'use strict';

const crypto = require('crypto');

// Consistent Hashing Ring
//
// normally hash(key) % N is bad because if a node dies, almost every key remaps.
// consistent hashing fixes this by putting nodes and keys on a ring.
//
// we use 50 virtual nodes per physical node so the load is actually balanced,
// otherwise random hashing can put too many keys on one node.

const VIRTUAL_NODES = 50;

class ConsistentHashRing {
  constructor(nodeNames = []) {
    this.ring            = new Map(); // position (uint32) → physical node name
    this.sortedPositions = [];        // sorted for binary search
    this.physicalNodes   = [];

    for (const name of nodeNames) {
      this.addNode(name);
    }
  }

  // simple hash: md5 -> first 8 hex chars -> uint32
  _hash(key) {
    return parseInt(
      crypto.createHash('md5').update(key).digest('hex').slice(0, 8),
      16
    );
  }

  addNode(name) {
    this.physicalNodes.push(name);

    for (let i = 0; i < VIRTUAL_NODES; i++) {
      const pos = this._hash(`${name}#vnode-${i}`);
      this.ring.set(pos, name);
      this.sortedPositions.push(pos);
    }

    // Keep sorted so binary search works
    this.sortedPositions.sort((a, b) => a - b);
  }

  // finds the right node for a key using binary search on the ring
  // essentially "walks clockwise" until it hits a node
  getNode(key) {
    if (!this.sortedPositions.length) return null;

    const h = this._hash(key);

    // Standard lower_bound binary search
    let lo = 0, hi = this.sortedPositions.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedPositions[mid] < h) lo = mid + 1;
      else hi = mid;
    }

    // Wrap around if we're past the last position
    const idx = lo % this.sortedPositions.length;
    return this.ring.get(this.sortedPositions[idx]);
  }

  // checks how balanced the ring is
  getDistribution() {
    const dist = {};
    for (const n of this.physicalNodes) dist[n] = 0;
    for (const v of this.ring.values()) dist[v]++;
    return dist;
  }

  getRingSize() {
    return this.sortedPositions.length;
  }
}

module.exports = { ConsistentHashRing };
