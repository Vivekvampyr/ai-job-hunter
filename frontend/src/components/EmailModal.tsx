import React, { useState, useEffect } from 'react';
import { X, Paperclip, Send, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded overflow-hidden border border-zinc-200 dark:border-[#262933] max-h-[90vh] flex flex-col bg-white dark:bg-[#15171c] transition-colors">
        {/* Modal Header */}
        <div className="p-3 border-b border-zinc-200 dark:border-[#262933] flex items-center justify-between bg-zinc-50/50 dark:bg-[#111317]">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Compose Outreach Email
            </h3>
            <p className="text-[11px] text-zinc-500">
              {job.title} at {job.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#1c1f26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 overflow-y-auto space-y-3 flex-1 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Drafting application email...</p>
            </div>
          ) : (
            <>
              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Recipient
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 transition-colors font-mono"
                  placeholder="careers@company.com"
                />
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 transition-colors"
                  placeholder="Application: Role - Candidate Name"
                />
              </div>

              {/* Body Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-sky-600 leading-relaxed resize-none transition-colors"
                />
              </div>

              {/* Resume Attachment Option */}
              <div className="p-2.5 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50/50 dark:bg-[#111317] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Attachment:</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">
                    {emailData?.resume_file_name || 'Resume'}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={attachResume}
                    onChange={(e) => setAttachResume(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-[#262933] text-sky-600 focus:ring-0"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">Attach file</span>
                </label>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-2 rounded text-xs flex items-center gap-1.5 border ${
                    statusMessage.type === 'success'
                      ? 'border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 bg-red-50/40 dark:bg-red-950/20'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#262933] flex items-center justify-between bg-zinc-50/50 dark:bg-[#111317]">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSend(true)}
              disabled={loading || sending}
              className="px-3 py-1 text-xs font-medium rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1c1f26] text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSend(false)}
              disabled={loading || sending}
              className="px-3 py-1 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
