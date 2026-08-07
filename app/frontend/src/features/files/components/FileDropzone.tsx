import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadFileApi } from '../services/files.api';
import { type KnowledgeFile } from '../types/files.types';
import { formatBytes } from '../utils/fileHelpers';

interface FileDropzoneProps {
  onFileUploaded: (file: KnowledgeFile, isDuplicate?: boolean, message?: string) => void;
}

export function FileDropzone({ onFileUploaded }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFileUpload(droppedFile);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFileUpload(selectedFile);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processFileUpload = async (file: File) => {
    setErrorMessage(null);
    setDuplicateNotice(null);

    // Client-side validation: Max 20MB
    const MAX_20MB = 20 * 1024 * 1024;
    if (file.size > MAX_20MB) {
      setErrorMessage(`File "${file.name}" exceeds the 20 MB size limit (${formatBytes(file.size)}).`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFileApi(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.isDuplicate) {
        setDuplicateNotice(result.message || 'This file already exists in your Knowledge Base.');
      }

      onFileUploaded(result.data, result.isDuplicate, result.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-blue-500/40 bg-[#0F172A]/40 hover:bg-[#0F172A]/80'
        } ${isUploading ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
            <FileUp className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isUploading ? 'Uploading file...' : 'Upload Knowledge Documents'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Drag & drop documents here or <span className="text-blue-400 font-medium underline">browse files</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {['PDF', 'Markdown', 'TXT', 'DOCX'].map((type) => (
              <span
                key={type}
                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]"
              >
                {type}
              </span>
            ))}
            <span className="inline-flex items-center text-[10px] text-slate-400 px-1 py-0.5">
              Max 20 MB
            </span>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs pt-2 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {duplicateNotice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{duplicateNotice}</span>
        </div>
      )}
    </div>
  );
}
