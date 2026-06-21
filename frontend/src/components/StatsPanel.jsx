import React, { useState, useEffect, useCallback } from 'react';
import { getStats } from '../api.js';
import './StatsPanel.css';

const REFRESH_INTERVAL = 6_000; // refresh every 6 seconds

function StatBar({ label, value, max = 100, color = 'var(--primary)', unit = '' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="stat-bar-row">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span className="stat-bar-value mono">{value}{unit}</span>
      </div>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StatNum({ label, value, sub, color }) {
  return (
    <div className="stat-num">
      <div className="stat-num-value" style={{ color }}>{value}</div>
      <div className="stat-num-label">{label}</div>
      {sub && <div className="stat-num-sub">{sub}</div>}
    </div>
  );
}

export default function StatsPanel() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getStats();
      setStats(data);
      setError(null);
    } catch {
      setError('Cannot reach backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => fetchStats(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="stats-panel glass-card">
        <div className="section-label">📊 System Stats</div>
        <div className="stats-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton stats-skel-row" style={{ animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-panel glass-card">
        <div className="section-label">📊 System Stats</div>
        <div className="stats-error">⚠ {error || 'No data'}</div>
      </div>
    );
  }

  const { cache, latency, database, batchWriter, trie } = stats;

  return (
    <div className="stats-panel glass-card fade-in">
      <div className="section-label">📊 System Stats</div>

      {/* ---- Key numbers row ---- */}
      <div className="stats-numbers">
        <StatNum
          label="Cache Hit Rate"
          value={`${cache.overall.hitRate}%`}
          sub={`${cache.overall.hits} hits`}
          color="var(--success)"
        />
        <StatNum
          label="p95 Latency"
          value={`${latency.p95}ms`}
          sub={`p50: ${latency.p50}ms`}
          color="var(--accent)"
        />
        <StatNum
          label="Write Reduction"
          value={`${batchWriter.reductionRate}%`}
          sub={`${batchWriter.totalSaved} saves`}
          color="var(--primary-light)"
        />
        <StatNum
          label="Trie Queries"
          value={trie.totalQueries?.toLocaleString() || '—'}
          sub="in memory"
          color="var(--warning)"
        />
      </div>

      {/* ---- Latency bars ---- */}
      <div className="stats-section">
        <div className="stats-section-title">Latency (ms)</div>
        <StatBar label="p50" value={latency.p50}  max={50}  color="var(--success)" unit="ms" />
        <StatBar label="p95" value={latency.p95}  max={100} color="var(--warning)" unit="ms" />
        <StatBar label="p99" value={latency.p99}  max={200} color="var(--danger)"  unit="ms" />
        <StatBar label="avg" value={latency.avg}  max={100} color="var(--accent)"  unit="ms" />
      </div>

      {/* ---- Cache per node ---- */}
      <div className="stats-section">
        <div className="stats-section-title">Cache Nodes</div>
        {cache.nodes.map(n => (
          <div key={n.name} className="cache-node-row">
            <span className="mono" style={{ color: 'var(--primary-light)', fontSize: '0.78rem' }}>{n.name}</span>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {n.entries} entries
            </span>
            <span
              className="badge badge-success"
              style={{ fontSize: '0.65rem' }}
            >
              {n.hitRate}% hits
            </span>
          </div>
        ))}
      </div>

      {/* ---- Batch writer ---- */}
      <div className="stats-section">
        <div className="stats-section-title">Batch Writer</div>
        <div className="bw-grid">
          <div className="bw-cell">
            <span className="bw-num mono">{batchWriter.totalSubmissions}</span>
            <span className="bw-lbl">Submissions</span>
          </div>
          <div className="bw-cell">
            <span className="bw-num mono">{batchWriter.totalDbWrites}</span>
            <span className="bw-lbl">DB Writes</span>
          </div>
          <div className="bw-cell">
            <span className="bw-num mono" style={{ color: 'var(--success)' }}>{batchWriter.totalSaved}</span>
            <span className="bw-lbl">Writes Saved</span>
          </div>
          <div className="bw-cell">
            <span className="bw-num mono">{batchWriter.buffered}</span>
            <span className="bw-lbl">Buffered</span>
          </div>
        </div>
        {batchWriter.lastFlushAt && (
          <div className="bw-last-flush mono">
            Last flush: {new Date(batchWriter.lastFlushAt).toLocaleTimeString()} ({batchWriter.lastFlushMs}ms)
          </div>
        )}
      </div>

      {/* ---- DB reads/writes ---- */}
      <div className="stats-section">
        <div className="stats-section-title">Database</div>
        <div className="db-row">
          <span>Reads (Trie misses)</span>
          <span className="mono">{database.reads}</span>
        </div>
        <div className="db-row">
          <span>Writes (flushed)</span>
          <span className="mono">{database.writes}</span>
        </div>
        <div className="db-row">
          <span>Sample size</span>
          <span className="mono">{latency.sampleSize} requests</span>
        </div>
      </div>
    </div>
  );
}
