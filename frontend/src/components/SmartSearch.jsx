import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

export default function SmartSearch() {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(-1);
  const debouncedQ = useDebounce(query, 300);
  const ref        = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    client.get('/ai/search/suggestions', { params: { q: debouncedQ } })
      .then(({ data }) => { setSuggestions(data.suggestions || []); setOpen(data.suggestions?.length > 0); })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  function handleSelect(s) {
    setQuery(s.label);
    setOpen(false);
    navigate(`/status?search=${encodeURIComponent(s.label)}`);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((p) => Math.min(p + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((p) => Math.max(p - 1, -1)); }
    if (e.key === 'Enter' && selected >= 0) { handleSelect(suggestions[selected]); }
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 w-48 lg:w-64 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
        {loading
          ? <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          : <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        }
        <input value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Smart search…"
          className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none flex-1 min-w-0" />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1d2e] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-scale-in origin-top">
          <p className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-50 dark:border-white/5">
            🤖 AI Suggestions
          </p>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}
                onClick={() => handleSelect(s)}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors text-sm
                  ${selected === i ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{s.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{s.type}</p>
                </div>
                <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
