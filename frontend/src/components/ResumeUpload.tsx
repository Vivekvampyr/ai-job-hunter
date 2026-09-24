import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw, Calendar, FileCheck } from 'lucide-react';
import { api } from '../services/api';
import type { ActiveResumeResponse, User } from '../types';

interface ResumeUploadProps {
  user: User | null;
  onUploadSuccess: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ user, onUploadSuccess }) => {
  const [activeResumeInfo, setActiveResumeInfo] = useState<ActiveResumeResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReuploadForm, setShowReuploadForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchActiveResume = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await api.getCurrentResume();
      setActiveResumeInfo(data);
      if (data.has_resume) {
        setShowReuploadForm(false);
      } else {
        setShowReuploadForm(true);
      }
    } catch (err) {
      console.error('Failed to fetch active resume status:', err);
      setActiveResumeInfo(null);
      setShowReuploadForm(true);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    setStatusMessage(null);
    setSelectedFileName(null);
    if (user) {
      fetchActiveResume();
    } else {
      setActiveResumeInfo(null);
      setShowReuploadForm(true);
      setIsLoadingStatus(false);
    }
  }, [user?.id]);

  const handleFileProcess = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      setStatusMessage({
        type: 'error',
        text: 'Please upload a valid PDF or DOCX resume document.',
      });
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    setStatusMessage(null);

    try {
      const res = await api.uploadResume(file);
      setStatusMessage({
        type: 'success',
        text: `${res.message} Extracted profile updated!`,
      });
      await fetchActiveResume();
      onUploadSuccess();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to process resume. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Resume Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Parses candidate profile, skills, roles, and location preferences for public ATS matching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeResumeInfo?.has_resume && (
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Resume Active
            </span>
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#27282f] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-[#373842]">
            Step 1
          </span>
        </div>
      </div>

      {/* Loading active resume check */}
      {isLoadingStatus && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span>Checking active resume status...</span>
        </div>
      )}

      {/* Active Resume State Card */}
      {!isLoadingStatus && activeResumeInfo?.has_resume && !showReuploadForm && (
        <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#1f2025] border border-emerald-200/80 dark:border-emerald-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50 shrink-0 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {activeResumeInfo.resume?.file_name}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {activeResumeInfo.resume?.file_type}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  ({Math.round((activeResumeInfo.resume?.file_size || 0) / 1024)} KB)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3 h-3 text-zinc-400" />
                Uploaded {activeResumeInfo.resume?.uploaded_at ? new Date(activeResumeInfo.resume.uploaded_at).toLocaleDateString() : 'Recently'}
              </p>
              {activeResumeInfo.preview_text_snippet && (
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2 bg-white dark:bg-[#16171a] p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 line-clamp-2">
                  "{activeResumeInfo.preview_text_snippet}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowReuploadForm(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#27282f] hover:bg-zinc-50 dark:hover:bg-[#32333b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#373842] hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Replace Resume</span>
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone (Shown when no resume exists or user clicked Replace) */}
      {(showReuploadForm || !activeResumeInfo?.has_resume) && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100/70 dark:bg-zinc-800/50'
                : 'border-zinc-300 dark:border-zinc-700/80 hover:border-zinc-500 dark:hover:border-zinc-500 bg-zinc-50/50 dark:bg-[#1a1b1f]/50 hover:bg-zinc-50 dark:hover:bg-[#1a1b1f]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2.5">
                <Loader2 className="w-7 h-7 text-zinc-800 dark:text-zinc-200 animate-spin" />
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Parsing resume & extracting profile...
                </div>
                <p className="text-xs text-zinc-500">Structuring candidate skills, target roles, and work mode</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-1 border border-zinc-200 dark:border-zinc-700">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedFileName ? (
                    <span className="font-semibold">{selectedFileName}</span>
                  ) : (
                    'Drop your PDF or DOCX resume here, or click to browse'
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  Supports <span className="font-mono text-zinc-700 dark:text-zinc-300">PDF</span> and{' '}
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">DOCX</span> (up to 10MB)
                </p>
              </div>
            )}
          </div>

          {activeResumeInfo?.has_resume && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setShowReuploadForm(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
              >
                Cancel & Keep Current Resume
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium border ${
            statusMessage.type === 'success'
              ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-zinc-800 dark:text-zinc-200 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
