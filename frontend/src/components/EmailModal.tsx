import React, { useState, useEffect } from 'react';
import { X, Mail, Paperclip, Send, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import type { Job, EmailPreview } from '../types';
import { api } from '../services/api';

interface EmailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSentSuccess: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ job, isOpen, onClose, onSentSuccess }) => {
  if (!isOpen || !job) return null;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailData, setEmailData] = useState<EmailPreview | null>(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachResume, setAttachResume] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const preview = await api.generateEmail(job!.id);
        if (isMounted) {
          setEmailData(preview);
          setRecipient(preview.recipient_email);
          setSubject(preview.subject);
          setBody(preview.body);
          setAttachResume(preview.resume_attached);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatusMessage({
            type: 'error',
            text: err?.response?.data?.detail || 'Failed to generate tailored application email.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDraft();
    return () => {
      isMounted = false;
    };
  }, [job]);

  const handleSend = async (asDraft: boolean) => {
    if (!recipient || !subject || !body) {
      setStatusMessage({ type: 'error', text: 'Please fill in all email fields.' });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      await api.sendApplication({
        job_id: job.id,
        recipient_email: recipient,
        subject,
        body,
        attach_resume: attachResume,
        save_as_draft: asDraft,
      });

      setStatusMessage({
        type: 'success',
        text: asDraft
          ? 'Draft successfully created in your Gmail account!'
          : 'Application email sent successfully with your resume attached!',
      });
      setTimeout(() => {
        onSentSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to send via Gmail. Please verify Gmail connection.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-[#373842] max-h-[90vh] flex flex-col bg-white dark:bg-[#222329] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#373842] flex items-center justify-between bg-zinc-50 dark:bg-[#1f2025]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Personalized Outreach Email</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 font-semibold">
                  Step 10
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Applying to <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{job.title}</span> at{' '}
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{job.company_name}</span>
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <p className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold">Generating tailored outreach pitch...</p>
              <p className="text-[11px] text-zinc-500">Matching candidate strengths with role requirements</p>
            </div>
          ) : (
            <>
              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Recipient Email (Careers / Recruiter)
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  placeholder="careers@company.com"
                />
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  placeholder="Application: Role - Candidate Name"
                />
              </div>

              {/* Body Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Personalized Message</label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3.5 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-300 dark:border-[#373842] rounded-xl text-zinc-800 dark:text-zinc-200 font-sans focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 leading-relaxed resize-none transition-colors"
                />
              </div>

              {/* Resume Attachment Confirmation */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Attached Resume:</span>
                    <span className="ml-1 text-zinc-600 dark:text-zinc-400 font-mono">
                      {emailData?.resume_file_name || 'Resume Document'}
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachResume}
                    onChange={(e) => setAttachResume(e.target.checked)}
                    className="rounded bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-0 accent-indigo-600"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold">Include Attachment</span>
                </label>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-[#373842] flex items-center justify-between bg-zinc-50 dark:bg-[#1f2025]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSend(true)}
              disabled={loading || sending}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-[#373842] bg-white dark:bg-[#27282f] hover:bg-zinc-100 dark:hover:bg-[#32333b] hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-800 dark:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Save as Gmail Draft
            </button>
            <button
              onClick={() => handleSend(false)}
              disabled={loading || sending}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
