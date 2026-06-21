'use strict';

// Trie for prefix-based typeahead suggestions.
// Key idea: store top-10 results at every node so lookups don't need DFS.
// Costs more memory but reads are way faster — worth it for a read-heavy system.

const MAX_SUGGESTIONS = 10;

class TrieNode {
  constructor() {
    this.children       = {};
    this.topSuggestions = []; // max 10, sorted by score desc
  }
}

class Trie {
  constructor() {
    this.root         = new TrieNode();
    this.totalQueries = 0;
  }

  insert(query, score, count) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    let node = this.root;
    this._mergeIntoTopK(node, { query: q, score, count });

    for (const ch of q) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }
      node = node.children[ch];
      this._mergeIntoTopK(node, { query: q, score, count });
    }

    this.totalQueries++;
  }

  // empty prefix returns top-10 overall
  search(prefix) {
    const p = prefix.toLowerCase().trim();

    if (!p) return this.root.topSuggestions.slice();

    let node = this.root;
    for (const ch of p) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }

    return node.topSuggestions.slice();
  }

  // called by batch writer after flushing new counts to the store
  update(query, newScore, newCount) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    let node = this.root;
    this._mergeIntoTopK(node, { query: q, score: newScore, count: newCount });

    for (const ch of q) {
      if (!node.children[ch]) {
        // new query from a user search, hasn't been inserted yet
        this.insert(query, newScore, newCount);
        return;
      }
      node = node.children[ch];
      this._mergeIntoTopK(node, { query: q, score: newScore, count: newCount });
    }
  }

  _mergeIntoTopK(node, entry) {
    const idx = node.topSuggestions.findIndex(s => s.query === entry.query);

    if (idx !== -1) {
      // already in list, just update it
      node.topSuggestions[idx] = entry;
    } else if (node.topSuggestions.length < MAX_SUGGESTIONS) {
      node.topSuggestions.push(entry);
    } else {
      const worst = node.topSuggestions[node.topSuggestions.length - 1];
      if (entry.score > worst.score) {
        node.topSuggestions[node.topSuggestions.length - 1] = entry;
      } else {
        return; // doesn't make top 10, skip the sort
      }
    }

    node.topSuggestions.sort((a, b) => b.score - a.score);
  }

  getStats() {
    return { totalQueries: this.totalQueries };
  }
}

module.exports = { Trie };
