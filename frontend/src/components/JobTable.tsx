import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Download,
  Users,
  Send,
  Mail,
  Phone
} from 'lucide-react';
import type { Job } from '../types';
import { MatchBadge } from './MatchBadge';

interface JobTableProps {
  jobs: Job[];
  onApply: (job: Job) => void;
  onExportExcel: (jobIds?: string[]) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  selectedWorkMode: string;
  setSelectedWorkMode: (mode: string) => void;
  selectedMatchLevel: string;
  setSelectedMatchLevel: (lvl: string) => void;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onApply,
  onExportExcel,
  selectedLocation,
  setSelectedLocation,
  selectedWorkMode,
  setSelectedWorkMode,
  selectedMatchLevel,
  setSelectedMatchLevel,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const pageSize = 20;

  // Filter jobs based on active selections
  const filteredJobs = jobs.filter((job) => {
    if (selectedWorkMode !== 'All' && job.work_mode.toLowerCase() !== selectedWorkMode.toLowerCase()) {
      return false;
    }
    if (selectedLocation !== 'All' && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }
    if (selectedMatchLevel !== 'All' && job.match?.match_level.toLowerCase() !== selectedMatchLevel.toLowerCase()) {
      return false;
    }
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      const matchText = `${job.company_name} ${job.title} ${job.location} ${job.required_skills.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, selectedWorkMode, selectedMatchLevel, tableSearch, jobs]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const toggleExpand = (jobId: string) => {
    setExpandedJobId((prev) => (prev === jobId ? null : jobId));
  };

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const el = document.getElementById('table-toolbar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-[#262933] rounded overflow-hidden">
      {/* Table Toolbar */}
      <div
        id="table-toolbar"
        className="p-3 border-b border-zinc-200 dark:border-[#262933] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#111317]"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
            Positions
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            ({filteredJobs.length})
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter positions..."
              className="text-xs bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] text-zinc-900 dark:text-zinc-100 rounded pl-7 pr-2 py-1 w-36 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
          >
            <option value="All">All Locations</option>
            <option value="Indore">Indore</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Remote">Remote</option>
          </select>

          {/* Match Level Filter */}
          <select
            value={selectedMatchLevel}
            onChange={(e) => setSelectedMatchLevel(e.target.value)}
            className="text-xs bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
          >
            <option value="All">All Matches</option>
            <option value="High">High Match</option>
            <option value="Medium">Medium Match</option>
            <option value="Low">Low Match</option>
          </select>

          {/* Work Mode Filter */}
          <select
            value={selectedWorkMode}
            onChange={(e) => setSelectedWorkMode(e.target.value)}
            className="text-xs bg-white dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] text-zinc-800 dark:text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
          >
            <option value="All">All Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Export Excel */}
          <button
            onClick={() => onExportExcel(filteredJobs.map((j) => j.id))}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#0f1013] hover:bg-zinc-100 dark:hover:bg-[#1a1d23] text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
            title="Download formatted Excel sheet"
          >
            <Download className="w-3 h-3 text-zinc-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 5-Column Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-[#262933] text-[11px] font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50/70 dark:bg-[#111317]">
              <th className="py-2 px-3">Role Title</th>
              <th className="py-2 px-3">Company</th>
              <th className="py-2 px-3">Location</th>
              <th className="py-2 px-3">Match</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-[#262933]">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-zinc-500">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">No matching positions found.</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Adjust filters or search query.</p>
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const hasContact =
                  (job.contact?.email && job.contact.email !== 'Not Found') ||
                  (job.contact?.phone && job.contact.phone !== 'Not Found');

                return (
                  <React.Fragment key={job.id}>
                    {/* Primary Row */}
                    <tr
                      onClick={() => toggleExpand(job.id)}
                      className={`hover:bg-zinc-50 dark:hover:bg-[#1a1d24] transition-colors cursor-pointer select-none ${
                        isExpanded ? 'bg-zinc-50/80 dark:bg-[#181a20]' : ''
                      }`}
                    >
                      {/* Column 1: Role Title */}
                      <td className="py-2.5 px-3 max-w-sm">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Expand row"
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-transform"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                isExpanded ? 'transform rotate-180' : '-rotate-90'
                              }`}
                            />
                          </button>
                          <span
                            className="font-medium text-zinc-900 dark:text-zinc-100 truncate"
                            title={job.title}
                          >
                            {job.title}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Company + ATS Tag */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {job.company_name}
                          </span>
                          {job.source_ats && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              · {job.source_ats}
                            </span>
                          )}
                          {job.company_website && (
                            <a
                              href={job.company_website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400"
                              title="Visit website"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Location & Work Mode */}
                      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                        <span className="truncate max-w-[160px] inline-block align-bottom" title={job.location}>
                          {job.location}
                        </span>
                        {job.work_mode && (
                          <span className="text-zinc-400 ml-1">
                            ({job.work_mode})
                          </span>
                        )}
                      </td>

                      {/* Column 4: Match % */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <MatchBadge match={job.match} />
                      </td>

                      {/* Column 5: Apply Action */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onApply(job)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition-colors inline-flex items-center gap-1 shrink-0"
                            title="Draft email application"
                          >
                            <Send className="w-3 h-3" />
                            <span>Apply</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Inspection Drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/70 dark:bg-[#111317]">
                        <td colSpan={5} className="p-3 border-y border-zinc-200 dark:border-[#262933]">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Skills Section */}
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5 font-medium">
                                Required Skills
                              </span>
                              {job.required_skills && job.required_skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {job.required_skills.map((s) => (
                                    <span
                                      key={s}
                                      className="text-[11px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] text-zinc-700 dark:text-zinc-300 font-mono"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-zinc-400 italic">No specific skills listed.</span>
                              )}
                            </div>

                            {/* Contact Details */}
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5 font-medium">
                                Direct Contact
                              </span>
                              {hasContact ? (
                                <div className="space-y-1">
                                  {job.contact?.email && job.contact.email !== 'Not Found' && (
                                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-mono">
                                      <Mail className="w-3 h-3 text-zinc-400" />
                                      <span>{job.contact.email}</span>
                                    </div>
                                  )}
                                  {job.contact?.phone && job.contact.phone !== 'Not Found' && (
                                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-mono">
                                      <Phone className="w-3 h-3 text-zinc-400" />
                                      <span>{job.contact.phone}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">
                                  No direct contact found for this listing.
                                </span>
                              )}
                            </div>

                            {/* Direct Actions & Links */}
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5 font-medium">
                                External Links
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Official ATS Page */}
                                <a
                                  href={job.apply_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded text-[11px] font-medium border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1e2129] text-zinc-800 dark:text-zinc-200 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>Official ATS Page</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                                </a>

                                {/* LinkedIn Post */}
                                <a
                                  href={
                                    job.source_ats?.toLowerCase().includes('linkedin')
                                      ? job.apply_url
                                      : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                                          job.title + ' ' + job.company_name
                                        )}&location=${encodeURIComponent(job.location || 'Remote')}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded text-[11px] font-medium border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1e2129] text-zinc-800 dark:text-zinc-200 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>LinkedIn Post</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                                </a>

                                {/* Hiring Team Search */}
                                <a
                                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                                    job.company_name + ' recruiter OR hiring manager'
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded text-[11px] font-medium border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1e2129] text-zinc-800 dark:text-zinc-200 transition-colors inline-flex items-center gap-1"
                                >
                                  <Users className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>Find Recruiter</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredJobs.length > 0 && (
        <div className="p-2.5 border-t border-zinc-200 dark:border-[#262933] flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#111317]">
          {/* Result counter */}
          <div className="text-xs text-zinc-500 font-mono">
            Showing {startIndex + 1}–{endIndex} of {filteredJobs.length} positions
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={`page-${p}`}
                  onClick={() => handlePageChange(p)}
                  className={`min-w-[28px] h-7 px-1.5 text-xs font-mono rounded transition-colors ${
                    currentPage === p
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                      : 'border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1d23]'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 select-none">
                  ...
                </span>
              )
            )}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTable;
