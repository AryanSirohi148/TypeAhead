// api helper functions. proxy handles localhost:3001 in dev.

const BASE = '';

export async function getSuggestions(prefix) {
  const res = await fetch(`${BASE}/suggest?q=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error('Suggest API error');
  return res.json();
}

export async function submitSearch(query) {
  const res = await fetch(`${BASE}/search`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Search API error');
  return res.json();
}

export async function getCacheDebug(prefix) {
  const res = await fetch(`${BASE}/cache/debug?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error('Cache debug API error');
  return res.json();
}

export async function getTrending(limit = 10) {
  const res = await fetch(`${BASE}/trending?limit=${limit}`);
  if (!res.ok) throw new Error('Trending API error');
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE}/stats`);
  if (!res.ok) throw new Error('Stats API error');
  return res.json();
}
