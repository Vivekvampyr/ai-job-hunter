import React, { useState, useRef, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Check } from 'lucide-react';
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
      setShowReuploadForm(!data.has_resume);
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
        text: 'Please upload a PDF or DOCX file.',
      });
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    setStatusMessage(null);

    try {
      await api.uploadResume(file);
      setStatusMessage({
        type: 'success',
        text: 'Resume uploaded and profile updated.',
      });
      await fetchActiveResume();
      onUploadSuccess();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to process resume.',
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
    <div className="bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-[#262933] rounded p-3 space-y-2">
      {/* Loading state */}
      {isLoadingStatus && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Checking resume status...</span>
        </div>
      )}

      {/* Active Resume Bar */}
      {!isLoadingStatus && activeResumeInfo?.has_resume && !showReuploadForm && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-zinc-500">Active Resume:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 font-mono">
              {activeResumeInfo.resume?.file_name}
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              ({Math.round((activeResumeInfo.resume?.file_size || 0) / 1024)} KB)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowReuploadForm(true)}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#262933] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              Replace Resume
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone (when no resume or replacing) */}
      {(showReuploadForm || !activeResumeInfo?.has_resume) && !isLoadingStatus && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-sky-600 bg-sky-50/20 dark:bg-sky-950/20'
                : 'border-zinc-300 dark:border-[#262933] hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-[#0f1013]'
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
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Parsing resume and extracting skills...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {selectedFileName ? (
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{selectedFileName}</span>
                  ) : (
                    'Upload resume (PDF or DOCX) to match positions'
                  )}
                </span>
                <span className="text-[11px] text-zinc-400">Click or drag file</span>
              </div>
            )}
          </div>

          {activeResumeInfo?.has_resume && (
            <div className="mt-1 text-right">
              <button
                type="button"
                onClick={() => setShowReuploadForm(false)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-950/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
