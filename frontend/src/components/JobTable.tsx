import React, { useState, useEffect } from 'react';
import { ExternalLink, Mail, Phone, MapPin, Building, Send, Download, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Job } from '../types';
import { MatchBadge } from './MatchBadge';

interface JobTableProps {
  jobs: Job[];
  onApply: (job: Job) => void;
  onExportExcel: () => void;
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

  // Reset to page 1 whenever any filter, search, or jobs list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, selectedWorkMode, selectedMatchLevel, tableSearch, jobs]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Helper for generating page numbers (e.g. 1, 2, 3, 4, 5, 6, 7 ... 10)
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
    // Smooth scroll to top of table if scrolled
    const el = document.getElementById('discovered-positions-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#373842] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/60 dark:bg-[#1c1d22]/60">
        <div>
          <div className="flex items-center gap-2" id="discovered-positions-heading">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Discovered Positions ({filteredJobs.length})
            </h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#2b2c34] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Direct ATS
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time public postings from Ashby, Lever, Greenhouse, SmartRecruiters, Workday & verified feeds.
          </p>
        </div>

        {/* Action Controls & Excel Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Table quick search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter positions..."
              className="text-xs bg-white dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] text-zinc-900 dark:text-zinc-100 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 w-36 transition-colors"
            />
          </div>

          {/* Quick Filter: Location */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs bg-white dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          >
            <option value="All">All Locations</option>
            <option value="Indore">Indore</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Remote">Remote</option>
          </select>

          {/* Quick Filter: Match Level */}
          <select
            value={selectedMatchLevel}
            onChange={(e) => setSelectedMatchLevel(e.target.value)}
            className="text-xs bg-white dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          >
            <option value="All">All Matches</option>
            <option value="High">High Match Only</option>
            <option value="Medium">Medium Match</option>
            <option value="Low">Low Match</option>
          </select>

          {/* Quick Filter: Work Mode */}
          <select
            value={selectedWorkMode}
            onChange={(e) => setSelectedWorkMode(e.target.value)}
            className="text-xs bg-white dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          >
            <option value="All">All Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Excel Export Button */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download formatted Excel sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-[#373842] text-[11px] font-medium text-zinc-500 uppercase tracking-wider bg-zinc-100/50 dark:bg-[#18191d]/60">
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Role Title</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Work Mode</th>
              <th className="py-3 px-4">Match</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4 text-right">Apply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800 text-xs">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-500">
                  <Building className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-zinc-600 opacity-60" />
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">No matching positions found.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Try selecting "All Matches" or another query filter.</p>
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-zinc-50 dark:hover:bg-[#25262c]/50 transition-colors group"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {job.company_name}
                      {job.company_website && (
                        <a
                          href={job.company_website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                        job.source_ats?.toLowerCase().includes('greenhouse')
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                          : job.source_ats?.toLowerCase().includes('ashby')
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
                          : job.source_ats?.toLowerCase().includes('lever')
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                          : job.source_ats?.toLowerCase().includes('linkedin')
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0a66c2] dark:text-sky-300 border-sky-200 dark:border-sky-800/40'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {job.source_ats}
                    </span>
                  </td>

                  {/* Role Title */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate" title={job.title}>
                      {job.title}
                    </span>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.required_skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/40 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {job.required_skills.length > 3 && (
                          <span className="text-[10px] text-zinc-500 font-mono font-medium">
                            +{job.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[140px]" title={job.location}>
                        {job.location}
                      </span>
                    </div>
                  </td>

                  {/* Work Mode */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                        job.work_mode?.toLowerCase() === 'remote'
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50'
                          : job.work_mode?.toLowerCase() === 'hybrid'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {job.work_mode}
                    </span>
                  </td>

                  {/* Match Badge */}
                  <td className="py-3.5 px-4">
                    <MatchBadge match={job.match} />
                  </td>

                  {/* Contact Info (strictly "Not Found" if unavailable) */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Mail className="w-3 h-3 text-zinc-400" />
                        <span
                          className={
                            job.contact?.email === 'Not Found'
                              ? 'text-zinc-400 italic'
                              : 'font-mono text-zinc-900 dark:text-zinc-100 font-semibold'
                          }
                        >
                          {job.contact?.email || 'Not Found'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span
                          className={
                            job.contact?.phone === 'Not Found'
                              ? 'text-zinc-400 italic'
                              : 'font-mono text-zinc-700 dark:text-zinc-300'
                          }
                        >
                          {job.contact?.phone || 'Not Found'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Apply Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                      {/* View on LinkedIn */}
                      <a
                        href={
                          job.source_ats?.toLowerCase().includes('linkedin')
                            ? job.apply_url
                            : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company_name)}&location=${encodeURIComponent(job.location || 'Remote')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-[#0a66c2] hover:text-[#004182] dark:text-[#388be8] dark:hover:text-[#70b5f9] bg-sky-50/70 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/40 transition-colors inline-flex items-center gap-1 shadow-sm shrink-0"
                        title={`View ${job.title} at ${job.company_name} on LinkedIn`}
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>

                      {/* Find Recruiter on LinkedIn */}
                      <a
                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(job.company_name + ' technical recruiter OR talent acquisition OR hiring manager')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/40 transition-colors inline-flex items-center gap-1 shadow-sm shrink-0"
                        title={`Find recruiters or hiring managers for ${job.company_name} on LinkedIn`}
                      >
                        <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Recruiter</span>
                      </a>

                      {/* Direct ATS Page */}
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-[#1a1b1f] hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors inline-flex items-center gap-1 shadow-sm shrink-0"
                        title="Open official ATS application form"
                      >
                        <span>ATS Page</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>

                      {/* 1-Click Cold Outreach CTA */}
                      <button
                        onClick={() => onApply(job)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Generate tailored AI outreach email draft via Gmail"
                      >
                        <Send className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredJobs.length > 0 && (
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-[#373842] flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/60 dark:bg-[#1c1d22]/60">
          {/* Result counter */}
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{startIndex + 1}</span>–
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{endIndex}</span> of{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filteredJobs.length}</span> positions
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] ml-1.5 font-mono">
              (20 per page)
            </span>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous */}
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-[#373842] bg-white dark:bg-[#25262c] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2e3037] disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Numbered page buttons */}
            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={`page-${p}`}
                  onClick={() => handlePageChange(p)}
                  className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/40'
                      : 'bg-white dark:bg-[#25262c] border border-zinc-200 dark:border-[#373842] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-[#2e3037]'
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

            {/* Next */}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-[#373842] bg-white dark:bg-[#25262c] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2e3037] disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
              title="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
