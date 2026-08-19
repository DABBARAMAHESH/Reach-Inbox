import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';

interface CsvValidationResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRecipients: { email: string; name?: string }[];
  invalidRows: { row: number; data: any; reason: string }[];
}

interface FileUploadProps {
  onValidated: (recipients: { email: string; name?: string }[], result: CsvValidationResult) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onValidated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Invalid file format. Please upload a .csv or .txt file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/campaigns/parse-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data: CsvValidationResult = res.data.data;
      setValidationResult(data);
      onValidated(data.validRecipients, data);
      toast.success(`CSV parsed: ${data.validCount} valid recipients ready`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to parse CSV file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10'
            : validationResult
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isAnalyzing ? (
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          ) : validationResult ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <UploadCloud className="w-8 h-8 text-slate-400" />
          )}

          <div className="text-sm">
            {fileName ? (
              <span className="font-semibold text-sky-400">{fileName}</span>
            ) : (
              <span className="text-slate-300 font-medium">Click to upload or drag & drop CSV file</span>
            )}
          </div>
          <p className="text-xs text-slate-500">Supports headers: email, name (Max size: 5MB)</p>
        </div>
      </div>

      {validationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            <span>CSV Parsing Summary</span>
            <span className="text-sky-400">{validationResult.totalRows} Total Rows</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
              <span className="block text-lg font-bold text-emerald-400">{validationResult.validCount}</span>
              <span className="text-[11px] text-emerald-300 font-medium">Valid Emails</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
              <span className="block text-lg font-bold text-rose-400">{validationResult.invalidCount}</span>
              <span className="text-[11px] text-rose-300 font-medium">Invalid Emails</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <span className="block text-lg font-bold text-amber-400">{validationResult.duplicateCount}</span>
              <span className="text-[11px] text-amber-300 font-medium">Duplicates Removed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
