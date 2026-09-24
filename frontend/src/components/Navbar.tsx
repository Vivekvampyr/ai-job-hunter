import React from 'react';
import { Briefcase, Mail, CheckCircle2, Send, LogIn, LogOut, Sun, Moon } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#373842] bg-white/90 dark:bg-[#1f2025]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Indigo Gradient Icon */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('jobs')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 transition-transform hover:scale-105">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                AI Job Hunter
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ATS Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Public ATS Discovery & AI Outreach Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Lively Segmented Control) */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-100 dark:bg-[#27282f] p-1 rounded-xl border border-zinc-200 dark:border-[#373842]">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'jobs'
                ? 'bg-white dark:bg-[#1a1b1f] text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Job Discovery
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-[#1a1b1f] text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Candidate Profile
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'applications'
                ? 'bg-white dark:bg-[#1a1b1f] text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-indigo-500" />
            Applications
            {applicationsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                {applicationsCount}
              </span>
            )}
          </button>
        </nav>

        {/* User, Theme Toggle & Gmail Status */}
        <div className="flex items-center space-x-2.5">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-lg border border-zinc-200 dark:border-[#373842] bg-white dark:bg-[#27282f] text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 transition-colors shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Gmail Connect Button */}
          {user?.is_gmail_connected ? (
            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1.5 rounded-lg text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left hidden sm:block">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">Gmail Connected</span>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono truncate max-w-[110px]">{user.gmail_email || 'Ready'}</p>
              </div>
              <button
                onClick={onDisconnectGmail}
                className="text-[10px] text-zinc-400 hover:text-rose-500 ml-1 underline transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectGmail}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#27282f] hover:bg-zinc-50 dark:hover:bg-[#32333b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#373842] transition-colors shadow-sm"
              title="Connect Gmail to send applications with 1 click"
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Connect Gmail</span>
            </button>
          )}

          {/* User Session / Auth Trigger */}
          <div className="flex items-center space-x-2 border-l border-zinc-200 dark:border-[#373842] pl-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-sm flex items-center justify-center text-xs font-bold">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[110px]">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all"
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
