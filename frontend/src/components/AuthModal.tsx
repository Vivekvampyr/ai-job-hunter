import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
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
      const detail = err?.response?.data?.detail;
      let msg = 'Authentication failed. Please check your credentials.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
      setErrorMsg(msg);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded overflow-hidden border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] flex flex-col transition-colors">
        {/* Header */}
        <div className="p-3 border-b border-zinc-200 dark:border-[#262933] flex items-center justify-between bg-zinc-50/50 dark:bg-[#111317]">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-[11px] text-zinc-500">
              {mode === 'login'
                ? 'Access saved preferences and application drafts'
                : 'Save preferences and configure outreach'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#1c1f26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-[#262933] bg-zinc-50/50 dark:bg-[#111317]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              mode === 'login'
                ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-sky-600 bg-white dark:bg-[#15171c] font-semibold'
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
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              mode === 'register'
                ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-sky-600 bg-white dark:bg-[#15171c] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-3 text-xs">
          {errorMsg && (
            <div className="p-2 rounded border border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vivek Rajawat"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-1.5 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          <div className="relative my-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-[#262933]"></div>
            </div>
            <span className="relative px-2 bg-white dark:bg-[#15171c] text-[10px] text-zinc-400 font-mono">
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50 dark:bg-[#111317] hover:bg-zinc-100 dark:hover:bg-[#1c1f26] text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Continue as Demo Candidate (Vivek Rajawat)
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
