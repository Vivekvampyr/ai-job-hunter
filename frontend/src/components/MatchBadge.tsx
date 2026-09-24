import React, { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import type { JobMatchDetail } from '../types';

interface MatchBadgeProps {
  match?: JobMatchDetail;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({ match }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!match) {
    return <span className="text-xs text-zinc-400 font-mono">Evaluating...</span>;
  }

  const { match_level, match_score, matched_skills, missing_skills, role_fit, location_fit, reasons } = match;

  const getBadgeStyle = () => {
    switch (match_level) {
      case 'High':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40';
      case 'Medium':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40';
      case 'Pending':
        return 'bg-zinc-100 dark:bg-[#25262c] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60';
      case 'Low':
      default:
        return 'bg-zinc-100 dark:bg-[#282930] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  const getDotStyle = () => {
    switch (match_level) {
      case 'High':
        return 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'Medium':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'Pending':
        return 'bg-zinc-400 dark:bg-zinc-500';
      case 'Low':
      default:
        return 'bg-zinc-400 dark:bg-zinc-500';
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${getBadgeStyle()}`}
      >
        <span className={`w-2 h-2 rounded-full ${getDotStyle()}`} />
        <span>{match_level === 'Pending' ? 'No Resume' : `${match_level} Match`}</span>
        <span className="text-[11px] font-mono opacity-90">({match_score}%)</span>
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Breakdown */}
      {showTooltip && (
        <div className="absolute z-50 left-0 bottom-full mb-2 w-72 p-3.5 bg-white dark:bg-[#1f2025] border border-zinc-200 dark:border-[#373842] rounded-xl shadow-xl text-left">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Match Breakdown</span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                match_level === 'High'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : match_level === 'Medium'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : match_level === 'Pending'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {match_level === 'Pending' ? 'Awaiting Resume' : `${match_score}% Score`}
            </span>
          </div>

          {/* Scores Overview */}
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between items-center text-[11px]">
              <span>Role Compatibility:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                {role_fit ? 'Matched (30%)' : 'Partial (10%)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Location / Mode Fit:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                {location_fit ? 'Aligned (15%)' : 'Other (5%)'}
              </span>
            </div>
          </div>

          {/* Matched Skills */}
          {matched_skills.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                Matched Skills ({matched_skills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {matched_skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-0.5 font-medium"
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {missing_skills.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Unmatched Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {missing_skills.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-[#16171a] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center gap-0.5"
                  >
                    <X className="w-2.5 h-2.5 opacity-60" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Explanations */}
          {reasons.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 leading-snug">
                {reasons[0]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
