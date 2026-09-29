import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ResumeUpload } from './components/ResumeUpload';
import { ProfileEditor } from './components/ProfileEditor';
import { SearchQueryBar } from './components/SearchQueryBar';
import { JobTable } from './components/JobTable';
import { EmailModal } from './components/EmailModal';
import { ApplicationsHistory } from './components/ApplicationsHistory';
import { AuthModal } from './components/AuthModal';
import type { User, CandidateProfile, Job, Application } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ai_job_hunter_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default to dark with soft grey background
  });

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>('Python Developer Remote');
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'profile' | 'applications'>('jobs');

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ai_job_hunter_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Filters
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All');
  const [selectedMatchLevel, setSelectedMatchLevel] = useState('All');

  // Modal States
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [userData, profileData, appsData] = await Promise.all([
        api.getMe(),
        api.getProfile(),
        api.getApplications(),
      ]);
      setUser(userData);
      setProfile(profileData);
      const queryList = profileData.search_queries || [];
      setQueries(queryList);
      if (queryList.length > 0) {
        setActiveQuery(queryList[0]);
      } else {
        setActiveQuery('');
      }
      setApplications(appsData);

      // Perform initial job discovery search
      const initialJobs = await api.getJobs();
      setJobs(initialJobs);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Resume Upload Completion
  const handleUploadSuccess = async () => {
    try {
      const updatedProfile = await api.getProfile();
      setProfile(updatedProfile);
      const queryList = updatedProfile.search_queries || [];
      setQueries(queryList);

      // Trigger automatic search with first extracted query strictly from resume
      const firstQuery = queryList[0] || 'Software Engineer Remote';
      setActiveQuery(firstQuery);
      handleSearch(firstQuery);
    } catch (err) {
      console.error('Error refreshing profile after upload:', err);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (updated: Partial<CandidateProfile>) => {
    const res = await api.updateProfile(updated);
    setProfile(res);
    setQueries(res.search_queries || []);
  };

  // Handle Job Search
  const handleSearch = async (queryText: string) => {
    setIsSearching(true);
    setActiveQuery(queryText);
    try {
      const results = await api.searchJobs({
        query: queryText,
        locations: profile?.preferred_locations,
        work_modes: profile?.work_preferences,
      });
      setJobs(results);
    } catch (err) {
      console.error('Failed searching jobs:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Excel Export
  const handleExportExcel = async (jobIds?: string[]) => {
    try {
      await api.downloadExcel({
        job_ids: jobIds && jobIds.length > 0 ? jobIds : undefined,
        query: activeQuery || undefined,
        location: selectedLocation,
        work_mode: selectedWorkMode,
        match_level: selectedMatchLevel,
      });
    } catch (err) {
      console.error('Failed to export Excel file via blob, falling back to direct URL:', err);
      const url = api.getExcelExportUrl({
        query: activeQuery || undefined,
        location: selectedLocation,
        work_mode: selectedWorkMode,
        match_level: selectedMatchLevel,
      });
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AI_Job_Hunter_Matches.xlsx');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  // Open Apply Modal
  const handleApplyClick = (job: Job) => {
    setSelectedJobForApply(job);
    setIsEmailModalOpen(true);
  };

  // Gmail OAuth Connect
  const handleConnectGmail = async () => {
    try {
      const authUrl = await api.getGmailAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      alert('Could not start Gmail OAuth. Check backend settings.');
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      const updatedUser = await api.disconnectGmail();
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed disconnecting Gmail:', err);
    }
  };

  // Auth Handlers
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
    setJobs([]);
    setQueries([]);
    setApplications([]);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async () => {
    // Reset transient state before loading new account data
    setUser(null);
    setProfile(null);
    setJobs([]);
    setQueries([]);
    setApplications([]);
    await loadInitialData();
  };

  // Refresh Applications
  const handleSentSuccess = async () => {
    try {
      const apps = await api.getApplications();
      setApplications(apps);
    } catch (err) {
      console.error('Failed updating applications:', err);
    }
  };

  // Metrics
  const highMatchCount = jobs.filter((j) => j.match?.match_level === 'High').length;
  const mediumMatchCount = jobs.filter((j) => j.match?.match_level === 'Medium').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f1013] text-[#111827] dark:text-[#f3f4f6] flex flex-col selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onConnectGmail={handleConnectGmail}
        onDisconnectGmail={handleDisconnectGmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        applicationsCount={applications.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5">
        {/* Tab 1: Job Discovery */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {/* Header & Stats Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-200 dark:border-[#262933]">
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Job Discovery
                </h1>
                <p className="text-xs text-zinc-500">
                  Aggregating open roles from Ashby, Greenhouse, Lever, SmartRecruiters, and Workday.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                <span>{jobs.length} total</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {highMatchCount} high match
                </span>
                <span>·</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {mediumMatchCount} medium
                </span>
              </div>
            </div>

            {/* Resume Upload Status Bar */}
            <ResumeUpload user={user} onUploadSuccess={handleUploadSuccess} />

            {/* Target Query Filter Strip */}
            <SearchQueryBar
              queries={queries}
              activeQuery={activeQuery}
              onSelectQuery={handleSearch}
              onSearch={handleSearch}
              isSearching={isSearching}
            />

            {/* Positions Table */}
            <JobTable
              jobs={jobs}
              onApply={handleApplyClick}
              onExportExcel={handleExportExcel}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedWorkMode={selectedWorkMode}
              setSelectedWorkMode={setSelectedWorkMode}
              selectedMatchLevel={selectedMatchLevel}
              setSelectedMatchLevel={setSelectedMatchLevel}
            />
          </div>
        )}

        {/* Tab 2: Candidate Profile Editor */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <ProfileEditor key={profile?.id || user?.id || 'profile'} profile={profile} onUpdateProfile={handleUpdateProfile} />
          </div>
        )}

        {/* Tab 3: Applications & Outreach History */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <ApplicationsHistory
              applications={applications}
              onOpenDiscovery={() => setActiveTab('jobs')}
            />
          </div>
        )}
      </main>

      {/* Step 10: Apply & Email Modal */}
      <EmailModal
        job={selectedJobForApply}
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedJobForApply(null);
        }}
        onSentSuccess={handleSentSuccess}
      />

      {/* Register / Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Minimal Tool Footer */}
      <footer className="border-t border-zinc-200 dark:border-[#262933] py-3 text-center text-xs text-zinc-500 bg-white dark:bg-[#15171c] transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <span>Job Hunter · Public ATS Discovery</span>
          <span className="font-mono text-zinc-400 dark:text-zinc-500">Ashby · Greenhouse · Lever · SmartRecruiters · Workday</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
