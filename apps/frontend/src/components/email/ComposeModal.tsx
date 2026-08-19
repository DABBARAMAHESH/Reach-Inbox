import React, { useState, useRef } from 'react';
import { useSenders } from '../../hooks/useSenders';
import { useCampaigns } from '../../hooks/useCampaigns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { Clock, Send, AlertTriangle, ArrowRight, Upload, Edit3, Paperclip, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose }) => {
  const { senders } = useSenders();
  const { createCampaign, isCreating } = useCampaigns();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderId, setSenderId] = useState('');
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2); // seconds
  const [hourlyLimit, setHourlyLimit] = useState(200);

  // Recipients input mode: 'file' (upload CSV/TXT) or 'manual' (type/paste)
  const [recipientMode, setRecipientMode] = useState<'file' | 'manual'>('file');
  const [manualText, setManualText] = useState('');
  const [recipients, setRecipients] = useState<{ email: string; name?: string }[]>([]);
  const [csvMetrics, setCsvMetrics] = useState<any>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<{
    filename: string;
    content: string;
    contentType: string;
    size: number;
  }[]>([]);

  // Auto-select first sender, or reset if selected sender is deleted
  React.useEffect(() => {
    if (senders.length > 0) {
      const exists = senders.some(s => s.id === senderId);
      if (!senderId || !exists) {
        setSenderId(senders[0].id);
      }
    } else {
      setSenderId('');
    }
  }, [senders, senderId]);

  const calculateEstimatedHours = () => {
    const total = recipients.length;
    if (total === 0) return '0 hours';
    const rateLimitHours = Math.ceil(total / (hourlyLimit || 200));
    const delaySecondsTotal = (total * (delayBetweenEmails || 2)) / 3600;
    const estimatedHours = Math.max(rateLimitHours, Math.ceil(delaySecondsTotal));
    return `Approximately ${estimatedHours} ${estimatedHours === 1 ? 'hour' : 'hours'}`;
  };

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderId) {
      toast.error('Please select an SMTP sender');
      return;
    }
    const hasBody = body && body.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;
    if (!hasBody && !hasAttachments) {
      toast.error('Please enter an email body or attach at least one file');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Please provide at least one valid recipient email');
      return;
    }
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    try {
      await createCampaign({
        subject,
        body,
        senderId,
        startTime: new Date(startTime).toISOString(),
        delayBetweenEmails: delayBetweenEmails * 1000,
        hourlyLimit,
        recipients,
        attachments: attachments.map(({ filename, content, contentType }) => ({
          filename,
          content,
          contentType
        }))
      });
      onClose();
      // Reset form
      setStep('form');
      setSubject('');
      setBody('');
      setRecipients([]);
      setManualText('');
      setAttachments([]);
      setCsvMetrics(null);
    } catch (e) {
      // Handled by hook error handler
    }
  };

  // Helper to parse manual text input live
  const handleManualTextChange = (text: string) => {
    setManualText(text);
    // Find all valid looking email strings in the text area
    const emailRegex = /([a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = text.match(emailRegex) || [];
    
    const seen = new Set<string>();
    const valid: { email: string }[] = [];
    
    matches.forEach(m => {
      const email = m.trim().toLowerCase();
      if (!seen.has(email)) {
        seen.add(email);
        valid.push({ email });
      }
    });

    setRecipients(valid);
    setCsvMetrics({
      totalRows: matches.length,
      validCount: valid.length,
      invalidCount: 0,
      duplicateCount: matches.length - valid.length
    });
  };

  const switchMode = (mode: 'file' | 'manual') => {
    setRecipientMode(mode);
    setRecipients([]);
    setManualText('');
    setCsvMetrics(null);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    filesArray.forEach((file) => {
      // Check individual size (max 5MB per file / total)
      const totalSize = attachments.reduce((acc, curr) => acc + curr.size, 0) + file.size;
      if (totalSize > 5 * 1024 * 1024) {
        toast.error(`Total attachment size exceeds the 5MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            content: base64Data,
            contentType: file.type || 'application/octet-stream',
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = ''; // clear input
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedSenderObj = senders.find((s) => s.id === senderId);
  const totalAttachmentsSize = attachments.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'form' ? 'Compose New Email Campaign' : 'Confirm Campaign Parameters'}
      subtitle={
        step === 'form'
          ? 'Set recipient list, delay, rate limits, and dispatch time'
          : 'Review campaign parameters before enqueueing BullMQ delayed jobs'
      }
      maxWidth="2xl"
    >
      {step === 'form' ? (
        <form onSubmit={handleNextToConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Campaign Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Product Announcement & Special Offer"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                SMTP Sender Identity
              </label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {senders.length === 0 ? (
                  <option value="">No senders found (Create one in Senders tab)</option>
                ) : (
                  senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({s.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Start Time (UTC)
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Email Body Content
            </label>
            <textarea
              rows={4}
              placeholder="Write your email body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Email Attachments section */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                📎 Attachments (Max 5MB)
              </label>
              {attachments.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Total Size: {Math.round(totalAttachmentsSize / 1024)} KB / 5120 KB
                </span>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-white truncate font-medium">{att.filename}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({Math.round(att.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Paperclip className="w-3.5 h-3.5 text-sky-400" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Attach Files
            </Button>
          </div>

          {/* Throttling Controls */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Delay Between Emails (seconds)
              </label>
              <input
                type="number"
                min={0}
                max={300}
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Hourly Limit (max emails/hr)
              </label>
              <input
                type="number"
                min={1}
                max={5000}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
              />
            </div>
          </div>

          {/* Recipients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Recipients List
              </label>
              
              {/* Tab Selector */}
              <div className="flex bg-slate-850 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => switchMode('file')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                    recipientMode === 'file'
                      ? 'bg-slate-750 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload CSV/TXT
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                    recipientMode === 'manual'
                      ? 'bg-slate-750 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Enter Manually
                </button>
              </div>
            </div>

            {recipientMode === 'file' ? (
              <FileUpload
                onValidated={(recList, metrics) => {
                  setRecipients(recList);
                  setCsvMetrics(metrics);
                }}
              />
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder={`Paste emails separated by newlines, commas, or spaces. e.g.:
kris@test.com
mahesh@test.com, krishna@jainuniversity.ac.in`}
                  value={manualText}
                  onChange={(e) => handleManualTextChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                
                {csvMetrics && csvMetrics.validCount > 0 && (
                  <div className="flex gap-4 text-xs font-semibold">
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                      🟢 {csvMetrics.validCount} Valid Emails Detected
                    </div>
                    {csvMetrics.duplicateCount > 0 && (
                      <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                        ⚠️ {csvMetrics.duplicateCount} Duplicates Ignored
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Completion Time Estimate */}
          {recipients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs">
              <span className="flex items-center text-sky-300">
                <Clock className="w-4 h-4 mr-2 text-sky-400" /> Estimated Campaign Duration:
              </span>
              <span className="font-bold text-sky-300">{calculateEstimatedHours()}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}>
              Review Summary
            </Button>
          </div>
        </form>
      ) : (
        /* Confirmation Screen */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Campaign Summary
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Subject:</span>
                <span className="font-semibold text-white text-sm">{subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Sender:</span>
                <span className="font-semibold text-white text-sm">
                  {selectedSenderObj?.displayName} ({selectedSenderObj?.email})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Recipients Count:</span>
                <span className="font-bold text-emerald-400 text-sm">{recipients.length} valid</span>
              </div>
              <div>
                <span className="text-slate-400 block">Start Time:</span>
                <span className="font-semibold text-white text-sm">
                  {new Date(startTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Minimum Send Delay:</span>
                <span className="font-semibold text-sky-400 text-sm">{delayBetweenEmails} seconds</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hourly Limit:</span>
                <span className="font-semibold text-amber-400 text-sm">{hourlyLimit} emails / hr</span>
              </div>
              <div className="col-span-2 border-t border-slate-800 pt-2">
                <span className="text-slate-400 block">Attachments:</span>
                <span className="font-semibold text-white text-sm">
                  {attachments.length > 0
                    ? `${attachments.length} files (${Math.round(totalAttachmentsSize / 1024)} KB)`
                    : 'None'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Estimated Completion:</span>
              <span className="font-bold text-sky-400">{calculateEstimatedHours()}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              BullMQ delayed jobs will be enqueued in Redis with deterministic job IDs. All scheduling parameters are restart-safe.
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setStep('form')}>
              Back to Edit
            </Button>
            <Button
              onClick={handleFinalSubmit}
              isLoading={isCreating}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Schedule Emails
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
export default ComposeModal;
