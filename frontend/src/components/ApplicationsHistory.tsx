import React from 'react';
import { Send, Clock, Mail, FileText } from 'lucide-react';
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
    <div className="bg-white dark:bg-[#222329] rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-[#373842] transition-colors">
      <div className="p-5 border-b border-zinc-200 dark:border-[#373842] flex items-center justify-between bg-zinc-50 dark:bg-[#1f2025]">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Tracked Applications & Outreach ({applications.length})
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Log of all personalized emails sent or saved as drafts through Gmail API with attached resume.
          </p>
        </div>
      </div>

      <div className="p-5">
        {applications.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Mail className="w-10 h-10 mx-auto mb-2 text-indigo-400 dark:text-indigo-500 opacity-60" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">No applications sent yet.</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Find matched roles in Job Discovery and click &ldquo;Apply&rdquo; to generate tailored emails with your resume.
            </p>
            <button
              onClick={onOpenDiscovery}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              Browse Matched Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{app.job_title}</span>
                    <span className="text-xs text-zinc-400">at</span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{app.company_name}</span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        app.status === 'Sent'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-zinc-400" />
                      {app.recipient_email || 'careers@company.com'}
                    </span>
                    {app.resume_attached && (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        Resume Attached
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                        app.match_level === 'High'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                          : app.match_level === 'Medium'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {app.match_level} ({app.match_score}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
