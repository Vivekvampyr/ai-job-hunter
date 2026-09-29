import React from 'react';
import { Clock, Mail, FileText } from 'lucide-react';
import type { Application } from '../types';

interface ApplicationsHistoryProps {
  applications: Application[];
  onOpenDiscovery: () => void;
}

export const ApplicationsHistory: React.FC<ApplicationsHistoryProps> = ({
  applications,
  onOpenDiscovery,
}) => {
  return (
    <div className="bg-white dark:bg-[#15171c] rounded border border-zinc-200 dark:border-[#262933] overflow-hidden">
      <div className="p-3 border-b border-zinc-200 dark:border-[#262933] flex items-center justify-between bg-zinc-50/50 dark:bg-[#111317]">
        <div>
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Tracked Applications ({applications.length})
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Personalized applications sent or drafted via Gmail.
          </p>
        </div>
      </div>

      <div className="p-3">
        {applications.length === 0 ? (
          <div className="text-center py-10 text-zinc-400">
            <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200">No applications sent yet.</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
              Select positions in the Job Discovery tab and click Apply to generate outreach emails.
            </p>
            <button
              onClick={onOpenDiscovery}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              Browse Open Positions
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-2.5 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50/40 dark:bg-[#111317] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{app.job_title}</span>
                    <span className="text-zinc-400">at</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{app.company_name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        app.status === 'Sent'
                          ? 'border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-zinc-400" />
                      {app.recipient_email || 'careers@company.com'}
                    </span>
                    {app.resume_attached && (
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                        <FileText className="w-3 h-3 text-zinc-400" />
                        Resume Attached
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      app.match_level === 'High'
                        ? 'bg-emerald-500'
                        : app.match_level === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {app.match_score}% ({app.match_level})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsHistory;
