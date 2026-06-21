import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSuggestions, submitSearch, getCacheDebug } from '../api.js';
import './SearchBox.css';

// main typeahead input component.
// handles debouncing, keyboard nav (arrows/enter/escape),
// and shows the cache stats for each suggestion.

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function highlightPrefix(text, prefix) {
  if (!prefix || !text.toLowerCase().startsWith(prefix.toLowerCase())) {
    return <span>{text}</span>;
  }
  return (
    <>
      <span className="suggestion-match">{text.slice(0, prefix.length)}</span>
      <span>{text.slice(prefix.length)}</span>
    </>
  );
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

export default function SearchBox({ onSearch, onPrefixChange }) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [open,        setOpen]        = useState(false);
  const [lastMeta,    setLastMeta]    = useState(null);  // {cacheHit, latencyMs, node}
  const [lastResult,  setLastResult]  = useState(null);  // {"message":"Searched"}
  const [error,       setError]       = useState(null);

  const inputRef     = useRef(null);
  const dropdownRef  = useRef(null);

  // ---- Debounced fetch ----
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (prefix) => {
      if (!prefix.trim()) {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getSuggestions(prefix);
        setSuggestions(data.suggestions || []);
        setLastMeta(data.meta || null);
        setOpen(true);
        setError(null);
        if (onPrefixChange) onPrefixChange(prefix);
      } catch {
        setError('Could not load suggestions. Is the backend running?');
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 200),
    [onPrefixChange]
  );

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    setLastResult(null);
    fetchSuggestions(val);
  };

  // ---- Search submit ----
  const handleSubmit = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setOpen(false);
    setQuery(q);
    setLoading(true);

    try {
      const res = await submitSearch(q);
      setLastResult(res);
      setError(null);
      if (onSearch) onSearch(q);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Keyboard navigation ----
  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0) {
          handleSubmit(suggestions[activeIdx].query);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIdx(-1);
        break;
      default:
        break;
    }
  };

  // ---- Scroll active item into view ----
  useEffect(() => {
    if (activeIdx >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.suggestion-item');
      items[activeIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  // ---- Close on outside click ----
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.parentElement?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentPrefix = activeIdx >= 0 && suggestions[activeIdx]
    ? suggestions[activeIdx].query
    : query;

  return (
    <div className="searchbox-wrapper">
      {/* --- Input row --- */}
      <div className={`searchbox-input-row ${loading ? 'loading' : ''} ${open ? 'open' : ''}`}>
        <span className="searchbox-icon">
          {loading
            ? <span className="spin-ring" />
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
          }
        </span>

        <input
          id="main-search-input"
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search anything... try 'iphone', 'python', 'netflix'..."
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {query && (
          <button
            className="searchbox-clear"
            onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); setLastResult(null); inputRef.current?.focus(); }}
            aria-label="Clear"
          >
            ✕
          </button>
        )}

        <button
          id="search-submit-btn"
          className="btn btn-primary searchbox-submit"
          onClick={() => handleSubmit()}
        >
          Search
        </button>
      </div>

      {/* --- Meta bar (cache info) --- */}
      {lastMeta && open && suggestions.length > 0 && (
        <div className="searchbox-meta fade-in">
          <span className={`badge ${lastMeta.cacheHit ? 'badge-success' : 'badge-warning'}`}>
            {lastMeta.cacheHit ? '⚡ Cache HIT' : '💾 Cache MISS'}
          </span>
          <span className="meta-detail">Node: <b>{lastMeta.node}</b></span>
          <span className="meta-detail">{lastMeta.latencyMs}ms</span>
        </div>
      )}

      {/* --- Dropdown --- */}
      {open && suggestions.length > 0 && (
        <div className="suggestion-dropdown fade-in" ref={dropdownRef} role="listbox">
          {suggestions.map((s, i) => (
            <button
              key={s.query}
              id={`suggestion-item-${i}`}
              className={`suggestion-item ${i === activeIdx ? 'active' : ''}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSubmit(s.query); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="suggestion-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </span>
              <span className="suggestion-text">
                {highlightPrefix(s.query, query)}
              </span>
              <span className="suggestion-count">{formatCount(s.count)}</span>
              <span className="suggestion-arrow">↗</span>
            </button>
          ))}
        </div>
      )}

      {/* --- Search result toast --- */}
      {lastResult && (
        <div className="search-result-toast slide-up" key={lastResult.query}>
          <span className="toast-icon">✓</span>
          <span>
            <b className="gradient-text">"{lastResult.query}"</b>
            {' '}— {lastResult.message}. Count updating…
          </span>
        </div>
      )}

      {/* --- Error state --- */}
      {error && (
        <div className="search-error fade-in">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
