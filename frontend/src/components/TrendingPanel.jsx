import React, { useState, useEffect, useCallback } from 'react';
import { getTrending } from '../api.js';
import './TrendingPanel.css';

const REFRESH_INTERVAL = 10_000; // refresh every 10 seconds

const RANK_COLORS = [
  '#f59e0b', // #1 gold
  '#94a3b8', // #2 silver
  '#cd7c4a', // #3 bronze
];

function timeAgo(isoString) {
  if (!isoString) return '';
  const secs = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
}

export default function TrendingPanel({ onSelect }) {
  const [trending,    setTrending]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const fetchTrending = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);

    try {
      const data = await getTrending(10);
      setTrending(data.trending || []);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError('Cannot reach backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    const timer = setInterval(() => fetchTrending(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchTrending]);

  return (
    <div className="trending-panel glass-card">
      {/* Header */}
      <div className="trending-header">
        <div className="trending-title">
          <span className="fire-icon">🔥</span>
          <span>Trending</span>
        </div>
        <div className="trending-header-right">
          {refreshing && <span className="refreshing-dot" />}
          <button
            id="trending-refresh-btn"
            className="refresh-btn"
            onClick={() => fetchTrending(true)}
            title="Refresh trending"
          >
            ↻
          </button>
        </div>
      </div>

      {lastRefresh && (
        <div className="trending-last-refresh">
          Live · updated {timeAgo(lastRefresh.toISOString())}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="trending-skeleton">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton trending-skeleton-row" style={{ animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
      ) : error ? (
        <div className="trending-empty">⚠ {error}</div>
      ) : trending.length === 0 ? (
        <div className="trending-empty">
          <p>No trending data yet.</p>
          <p className="trending-hint">Search something to start trending!</p>
        </div>
      ) : (
        <div className="trending-list">
          {trending.map((item, i) => (
            <button
              key={item.query}
              id={`trending-item-${i}`}
              className="trending-item slide-up"
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => onSelect && onSelect(item.query)}
            >
              <span
                className="trending-rank"
                style={{ color: i < 3 ? RANK_COLORS[i] : 'var(--text-muted)' }}
              >
                {i < 3 ? ['①','②','③'][i] : `${i + 1}`}
              </span>

              <span className="trending-query">{item.query}</span>

              <div className="trending-right">
                <span className="trending-score">
                  {item.trendingScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                {item.lastSearched && (
                  <span className="trending-time">{timeAgo(item.lastSearched)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
