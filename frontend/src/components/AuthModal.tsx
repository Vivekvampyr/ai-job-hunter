import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'register') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        await api.register({
          email,
          password,
          full_name: fullName,
        });
      } else {
        await api.login({
          email,
          password,
        });
      }

      onAuthSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.loginDemo();
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to log in to demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-[#373842] bg-white dark:bg-[#222329] flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-[#373842] flex items-center justify-between bg-zinc-50 dark:bg-[#1f2025]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {mode === 'login' ? 'Sign In to AI Job Hunter' : 'Create Your Account'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mode === 'login'
                  ? 'Access your resume, ATS matches & sent applications'
                  : 'Start discovering relevant jobs and sending tailored outreach'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#2b2c34] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-[#373842] bg-zinc-100 dark:bg-[#1a1b1f]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all cursor-pointer ${
              mode === 'login'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500 bg-white dark:bg-[#222329]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all cursor-pointer ${
              mode === 'register'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500 bg-white dark:bg-[#222329]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vivek Rajawat"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-[#373842]"></div>
            </div>
            <span className="relative px-2 bg-white dark:bg-[#222329] text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Or Try Instantly
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#27282f] hover:bg-zinc-50 dark:hover:bg-[#32333b] hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#373842] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Continue as Demo Candidate (Vivek Rajawat)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
