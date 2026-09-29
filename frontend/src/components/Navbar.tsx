import React from 'react';
import { Mail, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'jobs' | 'profile' | 'applications';
  setActiveTab: (tab: 'jobs' | 'profile' | 'applications') => void;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  applicationsCount: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onConnectGmail,
  onDisconnectGmail,
  onOpenAuth,
  onLogout,
  applicationsCount,
  theme,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        {/* Brand & Tabs */}
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setActiveTab('jobs')}
          >
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Job Hunter
            </span>
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              [live]
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-zinc-100 dark:bg-[#1c1f26] text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'profile'
                  ? 'bg-zinc-100 dark:bg-[#1c1f26] text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Candidate Profile
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'applications'
                  ? 'bg-zinc-100 dark:bg-[#1c1f26] text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <span>Applications</span>
              {applicationsCount > 0 && (
                <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  ({applicationsCount})
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Actions: Theme, Gmail & Auth */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded border border-zinc-200 dark:border-[#262933] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-[#1c1f26] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-zinc-700" />
            )}
          </button>

          {/* Gmail Status */}
          {user?.is_gmail_connected ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50 dark:bg-[#1c1f26] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 max-w-[120px] truncate">
                {user.gmail_email || 'Connected'}
              </span>
              <button
                onClick={onDisconnectGmail}
                className="text-[10px] text-zinc-400 hover:text-red-500 ml-1 transition-colors"
                title="Disconnect Gmail"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectGmail}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-zinc-200 dark:border-[#262933] hover:bg-zinc-50 dark:hover:bg-[#1c1f26] text-zinc-700 dark:text-zinc-300 text-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Connect Gmail</span>
            </button>
          )}

          {/* User Auth */}
          <div className="flex items-center space-x-2 pl-1">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400 hidden md:inline font-mono">
                  {user.email}
                </span>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-[#1c1f26] rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

