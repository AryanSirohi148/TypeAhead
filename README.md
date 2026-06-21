# SearchAhead — Search Typeahead System

A full-stack **HLD Assignment** project implementing a production-grade search typeahead system with:

- ⚡ Sub-20ms suggestions via an **in-memory Trie**
- 🗄 **Distributed cache** across 3 nodes using **Consistent Hashing**
- 🔥 **Trending searches** with time-decay scoring
- 📦 **Batch writes** to reduce database write pressure
- 📊 Real-time **performance stats** (p95 latency, cache hit rate, write reduction)

---

## Architecture

```
Frontend (React + Vite :5173)
        │  HTTP (proxied)
        ▼
Backend (Express :3001)
   ├── GET /suggest?q=<prefix>    → Cache → Trie → Cache
   ├── POST /search               → Batch Buffer → DB (every 5s)
   ├── GET /cache/debug?prefix=   → Consistent Hash routing info
   ├── GET /trending              → Top queries by decay score
   └── GET /stats                 → p95, hit rate, write reduction

In-Memory Components:
   Trie         (100k+ queries, O(L) prefix lookup)
   CacheCluster (3 nodes, LRU + TTL=60s, Consistent Hashing)
   BatchWriter  (buffer → flush every 5s or 100 items)

Persistent:
   SQLite (typeahead.db, WAL mode)
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Start the backend (auto-seeds on first run)

```bash
cd backend
npm run dev
```

On first run, this will:
1. Generate ~100,000+ search queries
2. Insert them into SQLite (`backend/data/typeahead.db`)
3. Build the in-memory Trie (~5–15 seconds)
4. Start the API server on http://localhost:3001

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173**

---

## Dataset

The dataset is **synthetically generated** (no external download needed) by `backend/scripts/generateDataset.js`.

- **Method**: 500 realistic search subjects × 200 query templates = 100,000+ unique queries
- **Distribution**: Zipf's law — `count(rank) = 1,000,000 / rank`
  - Rank 1 query: ~1,000,000 searches
  - Rank 100k query: ~10 searches
- **Categories**: Phones, laptops, AI/software, programming, movies, music, e-commerce, health, finance, sports, food, travel, education

To reset and re-seed:
```bash
cd backend
rm -f data/typeahead.db
npm run seed    # or just npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suggest?q=<prefix>` | Top-10 suggestions for prefix, cache-first |
| POST | `/search` | Submit search: `{ "query": "..." }` → `{ "message": "Searched" }` |
| GET | `/cache/debug?prefix=<prefix>` | Cache node routing + HIT/MISS info |
| GET | `/trending` | Top-10 trending queries by decay score |
| GET | `/stats` | p95 latency, cache hit rate, batch stats |
| GET | `/health` | Uptime check |

---

## Design Decisions

### Trie (O(L) Prefix Lookup)
Each Trie node pre-stores the **top-10 suggestions** for its prefix. Lookup is `O(prefix_length)` — no DFS needed. Trade-off: higher memory, but reads massively outweigh writes in typeahead workloads.

### Distributed Cache (Consistent Hashing)
3 physical nodes, 50 virtual nodes each = 150 ring points. Binary search on the sorted ring for `O(log N)` key routing. Same prefix always maps to the same node (cache locality). Adding/removing a node remaps only `~1/N` keys.

### Trending Score
```
score = count × e^(−0.1 × hours_since_last_search)
```
- Recent searches get score ≈ count
- Queries from 24h ago get 9% of their count score
- Prevents viral-but-stale queries from dominating forever
- Recomputed every batch flush and every 5 minutes

### Batch Writes
- Buffer search submissions in memory
- Flush every **5 seconds** OR **100 items** (whichever comes first)
- Aggregate duplicates: 1000 "iphone" searches → 1 DB write (`count += 1000`)
- **Failure trade-off**: Data in buffer lost on crash. Production solution: persistent queue (Kafka, Redis Streams) or WAL file.

---

## Performance (typical local run)

| Metric | Value |
|--------|-------|
| p50 latency (cached) | < 1ms |
| p95 latency (cached) | 2–5ms |
| p95 latency (Trie miss) | 5–15ms |
| Cache hit rate (warm) | 80–95% |
| Write reduction | 60–95% (depends on query repetition) |

---

## Project Structure

```
TypeAhead_Project/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server + startup sequence
│   │   ├── trie.js               # Trie with top-K at every node
│   │   ├── batchWriter.js        # Buffered writes, periodic flush
│   │   ├── trending.js           # Exponential decay scoring
│   │   ├── db/database.js        # SQLite singleton (WAL mode)
│   │   ├── cache/
│   │   │   ├── consistentHash.js # MD5 ring, 150 virtual nodes
│   │   │   └── cacheCluster.js   # 3-node cluster, LRU + TTL
│   │   └── routes/
│   │       ├── suggest.js        # GET /suggest
│   │       ├── search.js         # POST /search
│   │       ├── cacheDebug.js     # GET /cache/debug
│   │       ├── trendingRoute.js  # GET /trending
│   │       └── stats.js          # GET /stats
│   ├── scripts/
│   │   ├── generateDataset.js    # 100k+ query generator
│   │   └── seed.js               # SQLite bulk insert
│   ├── data/                     # typeahead.db (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root layout
│   │   ├── api.js                # Fetch helpers
│   │   └── components/
│   │       ├── SearchBox.jsx     # Debounced input + dropdown
│   │       ├── TrendingPanel.jsx # Live trending list
│   │       ├── CacheDebugPanel.jsx # Hash routing visualiser
│   │       └── StatsPanel.jsx    # Live performance metrics
│   └── package.json
└── README.md
```


---

## Grading Checklist

| Requirement | Status | Where |
|---|---|---|
| Working dataset (100k+ queries) | ✅ | `scripts/generateDataset.js` |
| Suggestions API with prefix match | ✅ | `GET /suggest` + Trie |
| Sorted by count desc | ✅ | Trie top-K pre-sorted |
| Distributed cache (consistent hashing) | ✅ | `cache/cacheCluster.js` + `consistentHash.js` |
| Cache TTL/invalidation | ✅ | 60s TTL + invalidateForQuery() |
| Trending searches (recency-aware) | ✅ | `trending.js` — decay formula |
| Batch writes | ✅ | `batchWriter.js` — 5s/100-item flush |
| Debouncing in UI | ✅ | `SearchBox.jsx` — 200ms |
| Keyboard navigation | ✅ | ↑↓ Enter Escape |
| Cache debug endpoint | ✅ | `GET /cache/debug` |
| Performance report | ✅ | `GET /stats` + StatsPanel |
