import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  Square,
  Upload,
  Info,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Library,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useChat } from '../context/chatContext';
import { AttachExistingModal } from '../../files/components/AttachExistingModal';
import { validateUploadFile, FILE_ACCEPT_ATTRIBUTE } from '../../files/utils/files.validation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComposerAttachment {
  fileId: string;
  filename: string;
  extension: string;
  source: 'uploaded' | 'existing';
}

export const MessageComposer: React.FC = () => {
  const {
    sendMessage,
    isGenerating,
    isStreaming,
    cancelGeneration,
    selectedConversationId,
    uploadAndAttachFile,
    attachExistingFile,
  } = useChat();

  const [content, setContent] = useState('');
  const [composerFiles, setComposerFiles] = useState<ComposerAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [toastNotice, setToastNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showAttachModal, setShowAttachModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea logic (min 44px, max 220px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '44px';
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > 220) {
      textarea.style.height = '220px';
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${Math.max(44, scrollHeight)}px`;
      textarea.style.overflowY = 'hidden';
    }
  }, [content]);

  const showToast = (text: string, isError = false) => {
    setToastNotice({ text, isError });
    setTimeout(() => setToastNotice(null), 5000);
  };

  // Process file upload with client-side validation
  const handleProcessUpload = async (file: File) => {
    const validation = validateUploadFile(file);
    if (!validation.isValid) {
      showToast(`❌ ${validation.error}`, true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);

    try {
      const res = await uploadAndAttachFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (res?.fileId) {
        const ext = file.name.split('.').pop() || 'txt';
        setComposerFiles((prev) => [
          ...prev.filter((f) => f.fileId !== res.fileId),
          {
            fileId: res.fileId!,
            filename: file.name,
            extension: ext,
            source: 'uploaded',
          },
        ]);
        showToast(`Attached ${file.name} to message`);
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed. Please try again.';
      showToast(`❌ ${errorMsg}`, true);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleProcessUpload(selectedFile);
    }
  };

  // Handle Ctrl+V paste files
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleProcessUpload(file);
        }
      }
    }
  };

  // Handle send message
  const handleSend = () => {
    if ((!content.trim() && composerFiles.length === 0) || isGenerating || isUploading) return;
    const textToSend = content;
    const fileIds = composerFiles.map((f) => f.fileId);
    const attachmentSources = Object.fromEntries(composerFiles.map((f) => [f.fileId, f.source]));
    const filesMeta = composerFiles.map((f) => ({ fileId: f.fileId, filename: f.filename, extension: f.extension }));

    setContent('');
    setComposerFiles([]);

    sendMessage(textToSend, fileIds, attachmentSources, filesMeta);
  };

  // Keyboard shortcut handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (isGenerating || isStreaming) {
        cancelGeneration();
      } else if (content) {
        setContent('');
      }
    }
  };

  // Drag-and-drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleProcessUpload(droppedFile);
    }
  };

  const removeComposerFile = (fileId: string) => {
    setComposerFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-rose-500" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-3.5 w-3.5 text-indigo-500" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <FileIcon className="h-3.5 w-3.5 text-[var(--muted)]" />;
    }
  };

  const placeholderText = isStreaming || isGenerating
    ? 'Synapse AI is generating a response...'
    : 'Ask Synapse anything... (Enter to send, Shift+Enter for newline)';

  return (
    <div
      className="relative w-full p-4 select-none shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-and-Drop Visual Overlay */}
      {isDragging && (
        <div
          className="absolute inset-x-4 inset-y-0 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-md transition-all animate-in fade-in duration-150 p-6 text-center space-y-1"
          style={{
            borderColor: 'var(--primary)',
            backgroundColor: 'var(--surface-elevated)',
            color: 'var(--text-primary)',
          }}
        >
          <Upload className="h-8 w-8 animate-bounce mb-1" style={{ color: 'var(--primary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Drop file to attach to prompt</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Supported: PDF • Markdown • TXT • DOCX</p>
          <p className="text-[11px] font-medium" style={{ color: 'var(--primary)' }}>Maximum file size: 20 MB</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col space-y-2">
        {/* Toast Notice Banner */}
        {toastNotice && (
          <div
            className="flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium animate-in fade-in duration-150 shadow-xs"
            style={{
              backgroundColor: toastNotice.isError ? 'rgba(225, 29, 72, 0.1)' : 'var(--primary-muted)',
              borderColor: toastNotice.isError ? 'rgba(225, 29, 72, 0.3)' : 'var(--primary-border)',
              color: toastNotice.isError ? '#E11D48' : 'var(--primary)',
            }}
          >
            <div className="flex items-center gap-2">
              {toastNotice.isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <Info className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
              )}
              <span>{toastNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="p-0.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--muted)' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Composer Attached Files Chips Bar */}
        {(composerFiles.length > 0 || isUploading) && (
          <div className="flex flex-col space-y-1.5 px-1 pb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
              <Sparkles className="h-3 w-3" style={{ color: 'var(--primary)' }} />
              <span>Prompt Context Attachments ({composerFiles.length})</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {composerFiles.map((f) => (
                <div
                  key={f.fileId}
                  className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs shadow-2xs transition-all"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    {getFileIcon(f.extension)}
                    <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }} title={f.filename}>
                      {f.filename}
                    </span>
                  </div>

                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: 'var(--primary-muted)',
                      borderColor: 'var(--primary-border)',
                      color: 'var(--primary)',
                    }}
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>Attached</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => removeComposerFile(f.fileId)}
                    className="p-0.5 rounded-lg transition-colors cursor-pointer ml-0.5 hover:bg-rose-500/10 hover:text-rose-500"
                    style={{ color: 'var(--muted)' }}
                    title="Remove attachment"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Active Uploading Indicator Chip */}
              {isUploading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs animate-pulse" style={{ backgroundColor: 'var(--primary-muted)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="font-medium truncate max-w-[140px]">{uploadingFileName}</span>
                  <span className="font-mono text-[11px]">{uploadProgress}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Input Container Card */}
        <div
          className="relative flex items-center gap-3 rounded-3xl border p-2.5 transition-all duration-200 shadow-md backdrop-blur-2xl"
          style={{
            backgroundColor: 'var(--composer)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Attachment Dropdown Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2.5 rounded-2xl transition-all shrink-0 cursor-pointer hover:bg-[var(--surface-hover)]"
                style={{ color: 'var(--muted)' }}
                title="Attach Document"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 border shadow-xl" style={{ backgroundColor: 'var(--dropdown)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="gap-2.5 text-xs cursor-pointer"
              >
                <Upload className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                <div className="flex flex-col">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Upload New File</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>PDF, MD, DOCX, TXT • Max 20 MB</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowAttachModal(true)}
                className="gap-2.5 text-xs cursor-pointer"
              >
                <Library className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                <div className="flex flex-col">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Choose from Knowledge Base</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Reuse saved documents</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden Native File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={FILE_ACCEPT_ATTRIBUTE}
            onChange={handleFileChange}
          />

          {/* Auto-Resizing Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholderText}
            rows={1}
            className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none resize-none py-2 px-1 font-normal leading-relaxed max-h-[220px]"
            style={{
              color: 'var(--text-primary)',
            }}
          />

          {/* Synapse AI Model Badge Button */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] select-none shrink-0"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Sparkles className="h-3 w-3" style={{ color: 'var(--primary)' }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Synapse AI</span>
          </div>

          {/* Send / Stop Button */}
          {isGenerating || isStreaming ? (
            <button
              type="button"
              onClick={cancelGeneration}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-500 hover:bg-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer shadow-xs animate-pulse"
              title="Stop generating (Esc)"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={(!content.trim() && composerFiles.length === 0) || isUploading}
              className="flex h-9 w-9 items-center justify-center rounded-xl font-medium transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-xs"
              style={
                (content.trim() || composerFiles.length > 0) && !isUploading
                  ? {
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                    }
                  : {
                      backgroundColor: 'var(--surface-elevated)',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                    }
              }
              title="Send message (Enter)"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Footer Disclaimer Text */}
        <p className="text-[11px] text-center pt-1" style={{ color: 'var(--muted)' }}>
          Synapse may make mistakes. Please verify important information.
        </p>
      </div>

      {/* Attach Existing File Modal */}
      {showAttachModal && (
        <AttachExistingModal
          conversationId={selectedConversationId}
          onClose={() => setShowAttachModal(false)}
          onAttach={async (fileId, filename, extension) => {
            const ok = await attachExistingFile(fileId);
            if (ok) {
              setComposerFiles((prev) => [
                ...prev.filter((f) => f.fileId !== fileId),
                {
                  fileId,
                  filename,
                  extension,
                  source: 'existing',
                },
              ]);
              showToast(`Attached ${filename} to message`);
            }
            return ok;
          }}
        />
      )}
    </div>
  );
};
