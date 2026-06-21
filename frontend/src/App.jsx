import React, { useState } from 'react';
import SearchBox       from './components/SearchBox.jsx';
import TrendingPanel   from './components/TrendingPanel.jsx';
import CacheDebugPanel from './components/CacheDebugPanel.jsx';
import StatsPanel      from './components/StatsPanel.jsx';
import './App.css';

export default function App() {
  // currentPrefix is updated as the user types — drives the CacheDebugPanel
  const [currentPrefix, setCurrentPrefix] = useState('');
  // trendingKey increments after every search so TrendingPanel auto-refreshes
  const [trendingKey,   setTrendingKey]   = useState(0);
  const [activeTab,     setActiveTab]     = useState('trending'); // trending | cache | stats

  const handleSearch = () => {
    setTrendingKey(k => k + 1); // trigger trending refresh
  };

  const handleSuggestionSelect = (query) => {
    setCurrentPrefix(query);
  };

  return (
    <div className="app">
      {/* ---- Navbar ---- */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">SearchAhead</span>
          <span className="brand-tag">HLD · Typeahead System</span>
        </div>
        <div className="navbar-links">
          <a
            href="http://localhost:3001/stats"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            API
          </a>
          <div className="pulse-dot" title="Backend online" />
        </div>
      </nav>

      {/* ---- Hero section ---- */}
      <header className="hero">
        <div className="hero-badge">
          <span>Distributed Cache · Consistent Hashing · Trending · Batch Writes</span>
        </div>
        <h1 className="hero-title">
          Search <span className="gradient-text">Typeahead</span> System
        </h1>
        <p className="hero-subtitle">
          Start typing to see suggestions in real-time. Powered by an in-memory Trie,
          distributed cache across 3 nodes, and batch write buffering.
        </p>

        <SearchBox
          onSearch={handleSearch}
          onPrefixChange={setCurrentPrefix}
        />

        {/* Quick example chips */}
        <div className="example-chips">
          <span className="chips-label">Try:</span>
          {['iphone', 'python', 'netflix', 'how to', 'bitcoin', 'chatgpt'].map(ex => (
            <button
              key={ex}
              className="chip"
              onClick={() => setCurrentPrefix(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </header>

      {/* ---- Bottom panels ---- */}
      <main className="panels-area">
        {/* Tab nav (mobile) */}
        <div className="panel-tabs">
          {['trending', 'cache', 'stats'].map(tab => (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'trending' ? '🔥 Trending'
               : tab === 'cache'  ? '🗄 Cache Debug'
               :                    '📊 Stats'}
            </button>
          ))}
        </div>

        {/* Desktop: show all 3; mobile: only active tab */}
        <div className="panels-grid">
          <div className={`panel-col ${activeTab === 'trending' ? 'visible' : ''}`}>
            <TrendingPanel key={trendingKey} onSelect={handleSuggestionSelect} />
          </div>
          <div className={`panel-col ${activeTab === 'cache' ? 'visible' : ''}`}>
            <CacheDebugPanel prefix={currentPrefix} />
          </div>
          <div className={`panel-col ${activeTab === 'stats' ? 'visible' : ''}`}>
            <StatsPanel />
          </div>
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="footer">
        <span>
          Built for HLD Assignment · Node.js · SQLite · Custom Trie ·
          Consistent Hashing · Batch Writes · Trending Score
        </span>
      </footer>
    </div>
  );
}
