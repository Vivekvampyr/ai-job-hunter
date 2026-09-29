import React, { useState } from 'react';
import type { JobMatchDetail } from '../types';

interface MatchBadgeProps {
  match?: JobMatchDetail;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({ match }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!match) {
    return <span className="text-xs text-zinc-400 font-mono">—</span>;
  }

  const { match_level, match_score, matched_skills, missing_skills, role_fit, location_fit, reasons } = match;

  const dotColor =
    match_level === 'High'
      ? 'bg-emerald-500'
      : match_level === 'Medium'
      ? 'bg-amber-500'
      : 'bg-zinc-400 dark:bg-zinc-600';

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs hover:bg-zinc-100 dark:hover:bg-[#1c1f26] transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
          {match_score}%
        </span>
        <span className="text-[11px] text-zinc-400">
          {match_level === 'Pending' ? 'None' : match_level}
        </span>
      </button>

      {/* Popover Breakdown */}
      {showTooltip && (
        <div className="absolute z-50 left-0 bottom-full mb-1 w-64 p-3 bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-[#262933] rounded text-left">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-200 dark:border-[#262933]">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Match Details
            </span>
            <span className="font-mono text-xs text-zinc-500">
              {match_score}% ({match_level})
            </span>
          </div>

          <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between items-center text-[11px]">
              <span>Role Fit:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {role_fit ? 'Aligned' : 'Partial'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Location Fit:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {location_fit ? 'Aligned' : 'Other'}
              </span>
            </div>
          </div>

          {matched_skills.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-[#262933]">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Matched Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {matched_skills.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-1 py-0.2 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50 dark:bg-[#1a1d23] text-zinc-700 dark:text-zinc-300 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missing_skills.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-[#262933]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Missing Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {missing_skills.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-1 py-0.2 rounded border border-zinc-200 dark:border-[#262933] text-zinc-400 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-[#262933]">
              <p className="text-[11px] text-zinc-500 leading-snug">
                {reasons[0]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

