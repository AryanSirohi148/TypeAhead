import React, { useState, useEffect, useCallback } from 'react';
import { getCacheDebug } from '../api.js';
import './CacheDebugPanel.css';

// shows which node is handling a prefix and if it's cached or not.
// updates automatically when you type.

export default function CacheDebugPanel({ prefix }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async (p) => {
    if (p === undefined || p === null) return;
    setLoading(true);
    try {
      const res = await getCacheDebug(p);
      setData(res);
      setError(null);
    } catch {
      setError('Cannot reach backend');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_(prefix);
  }, [prefix, fetch_]);

  const nodes = ['node-0', 'node-1', 'node-2'];

  return (
    <div className="cache-panel glass-card">
      <div className="section-label">🗄 Cache Debug · Consistent Hashing</div>

      {/* Prefix input display */}
      <div className="cache-prefix-row">
        <span className="cache-prefix-label">Prefix</span>
        <span className="cache-prefix-value mono">
          {prefix ? `"${prefix}"` : <span style={{ color: 'var(--text-muted)' }}>(empty)</span>}
        </span>
      </div>

      {loading && <div className="cache-loading"><span className="spin-ring" /></div>}

      {!loading && error && (
        <div className="cache-error">⚠ {error}</div>
      )}

      {!loading && data && (
        <div className="cache-debug-body fade-in">
          {/* Ring visualisation */}
          <div className="ring-vis">
            {nodes.map(n => (
              <div
                key={n}
                className={`ring-node ${n === data.routing.assignedNode ? 'active' : ''}`}
              >
                <div className="ring-node-dot" />
                <span className="ring-node-label">{n}</span>
                {n === data.routing.assignedNode && (
                  <span className="ring-node-arrow">←</span>
                )}
              </div>
            ))}
          </div>

          {/* Routing info */}
          <div className="cache-info-grid">
            <div className="cache-info-row">
              <span className="ci-key">Assigned Node</span>
              <span className="ci-val mono" style={{ color: 'var(--accent)' }}>
                {data.routing.assignedNode}
              </span>
            </div>
            <div className="cache-info-row">
              <span className="ci-key">Ring Points</span>
              <span className="ci-val mono">{data.routing.totalRingPoints}</span>
            </div>
            <div className="cache-info-row">
              <span className="ci-key">VNodes / Node</span>
              <span className="ci-val mono">{data.routing.virtualNodesPerNode}</span>
            </div>
          </div>

          {/* Cache status */}
          <div className={`cache-status-box ${data.cacheStatus.hit ? 'hit' : 'miss'}`}>
            <div className="cache-status-header">
              <span className={`badge ${data.cacheStatus.hit ? 'badge-success' : 'badge-warning'}`}>
                {data.cacheStatus.hit ? '⚡ HIT' : '💾 MISS'}
              </span>
              {data.cacheStatus.hit && (
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  TTL: {data.cacheStatus.ttlRemaining}
                </span>
              )}
            </div>
            {data.cacheStatus.hit ? (
              <div className="cache-hit-detail mono">
                {data.cacheStatus.resultCount} suggestions · cached at {new Date(data.cacheStatus.cachedAt).toLocaleTimeString()}
              </div>
            ) : (
              <div className="cache-miss-detail">
                Not cached · next request will query the Trie and fill this slot
              </div>
            )}
          </div>

          {/* Node stats */}
          {data.nodeStats && (
            <div className="node-stats">
              <div className="node-stats-title">{data.routing.assignedNode} stats</div>
              <div className="ns-row">
                <span>Entries</span>
                <span className="mono">{data.nodeStats.entries}</span>
              </div>
              <div className="ns-row">
                <span>Hit Rate</span>
                <span className="mono" style={{ color: 'var(--success)' }}>
                  {data.nodeStats.hitRate}%
                </span>
              </div>
              <div className="ns-row">
                <span>Hits / Misses</span>
                <span className="mono">{data.nodeStats.hits} / {data.nodeStats.misses}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
