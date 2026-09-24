import React, { useState } from 'react';
import { Search, Compass, RefreshCw } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Target Search Queries
          </h3>
        </div>
        <span className="text-xs text-zinc-500">
          Derived from resume roles and preferred locations
        </span>
      </div>

      {/* Suggested Query Chips */}
      <div className="flex flex-wrap gap-2">
        {queries.map((q) => {
          const isSelected = activeQuery.toLowerCase() === q.toLowerCase();
          return (
            <button
              key={q}
              onClick={() => {
                setInputValue(q);
                onSelectQuery(q);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white font-semibold border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/25'
                  : 'bg-zinc-100/80 dark:bg-[#25262c] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              <Search className={`w-3 h-3 ${isSelected ? 'text-white' : 'opacity-60'}`} />
              {q}
            </button>
          );
        })}
      </div>

      {/* Custom Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search custom title, skill, or ATS keyword (e.g. Python FastAPI Engineer)"
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Searching ATS...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Search Jobs</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
