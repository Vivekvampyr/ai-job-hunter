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
      setQueries(profileData.search_queries || []);
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
      setQueries(updatedProfile.search_queries || []);

      // Trigger automatic search with first extracted query
      const firstQuery = updatedProfile.search_queries?.[0] || 'Python Developer Remote';
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
  const handleExportExcel = () => {
    const url = api.getExcelExportUrl({
      query: activeQuery,
      location: selectedLocation,
      work_mode: selectedWorkMode,
      match_level: selectedMatchLevel,
    });
    window.open(url, '_blank');
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
    setApplications([]);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    loadInitialData();
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
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#1a1b1f] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors duration-200">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Hero Banner with Quick Stats & Semantic Colors */}
        <section className="bg-white dark:bg-[#222329] border border-zinc-200 dark:border-[#373842] rounded-2xl p-6 sm:p-7 shadow-sm transition-colors duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500 opacity-80" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ATS Discovery Engine</span>
                <span className="text-emerald-400 dark:text-emerald-600">&bull;</span>
                <span className="text-emerald-600 dark:text-emerald-400">Zero Scraping</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Automated Job Discovery & Direct Outreach
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Aggregates real-time open positions from public Greenhouse, Lever, Ashby, and SmartRecruiters APIs.
                Extracts resume skills and generates tailored direct outreach drafts.
              </p>
            </div>

            {/* Quick Metrics with Semantic Colors */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 p-3.5 rounded-xl text-center min-w-[95px] shadow-sm">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 block">{jobs.length}</span>
                <span className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 uppercase tracking-wider font-semibold">Jobs Found</span>
              </div>
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 p-3.5 rounded-xl text-center min-w-[95px] shadow-sm">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block">{highMatchCount}</span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 uppercase tracking-wider font-semibold">High Match</span>
              </div>
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 p-3.5 rounded-xl text-center min-w-[95px] shadow-sm">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block">{mediumMatchCount}</span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 uppercase tracking-wider font-semibold">Med Match</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab 1: Job Discovery (Default MVP Flow) */}
        {activeTab === 'jobs' && (
          <div className="space-y-8">
            {/* Step 1 & 2: Resume Upload Dropzone & Active Status Card */}
            <ResumeUpload onUploadSuccess={handleUploadSuccess} />

            {/* Step 3: Auto-Generated Search Queries & Custom Bar */}
            <SearchQueryBar
              queries={queries}
              activeQuery={activeQuery}
              onSelectQuery={handleSearch}
              onSearch={handleSearch}
              isSearching={isSearching}
            />

            {/* Step 6, 7, 8: Discovered Jobs Table */}
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
          <div className="space-y-6">
            <ProfileEditor profile={profile} onUpdateProfile={handleUpdateProfile} />
          </div>
        )}

        {/* Tab 3: Applications & Outreach History */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-[#373842] py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-[#1f2025]/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Job Hunter &bull; Public ATS Discovery Engine &bull; Zero Scraping</span>
          <span className="text-zinc-400 dark:text-zinc-500">FastAPI &bull; PostgreSQL &bull; React &bull; Tailwind</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
