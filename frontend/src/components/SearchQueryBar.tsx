import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchQueryBarProps {
  queries: string[];
  activeQuery: string;
  onSelectQuery: (query: string) => void;
  onSearch: (customQuery: string) => void;
  isSearching: boolean;
}

export const SearchQueryBar: React.FC<SearchQueryBarProps> = ({
  queries,
  activeQuery,
  onSelectQuery,
  onSearch,
  isSearching,
}) => {
  const [inputValue, setInputValue] = useState(activeQuery);

  useEffect(() => {
    setInputValue(activeQuery);
  }, [activeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-[#262933] rounded p-3 space-y-2.5">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search positions by role, company, or keyword (e.g. Python FastAPI Engineer)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-3.5 py-1.5 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Suggested Query Tags */}
      {queries.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] text-zinc-400 shrink-0">
            Suggested queries:
          </span>
          {queries.map((q) => {
            const isSelected = activeQuery.toLowerCase() === q.toLowerCase();
            return (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setInputValue(q);
                  onSelectQuery(q);
                }}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'border-zinc-200 dark:border-[#262933] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchQueryBar;

