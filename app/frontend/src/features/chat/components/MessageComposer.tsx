import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
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

export const MessageComposer: React.FC = () => {
  const {
    sendMessage,
    isGenerating,
    isStreaming,
    cancelGeneration,
    selectedConversationId,
    attachedFiles,
    uploadAndAttachFile,
    attachExistingFile,
    detachFile,
  } = useChat();

  const [content, setContent] = useState('');
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

  // Process file upload with client-side validation and immediate error reset
  const handleProcessUpload = async (file: File) => {
    // 1. Client-side validation before making API request
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

      if (res?.message) {
        showToast(res.message);
      } else if (res?.attached) {
        showToast(`Attached ${file.name} to conversation`);
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

  // Handle send message
  const handleSend = () => {
    if (!content.trim() || isGenerating || isUploading) return;
    const textToSend = content;
    setContent('');
    sendMessage(textToSend);
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


  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-rose-400" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-3.5 w-3.5 text-indigo-400" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />;
      default:
        return <FileIcon className="h-3.5 w-3.5 text-slate-300" />;
    }
  };

  const placeholderText = isStreaming || isGenerating
    ? 'Synapse AI is generating a response...'
    : selectedConversationId
    ? 'Ask Synapse anything... (Enter to send, Shift+Enter for newline)'
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
        <div className="absolute inset-x-4 inset-y-0 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-[#090D16]/95 backdrop-blur-md transition-all animate-in fade-in duration-150 p-6 text-center space-y-1">
          <Upload className="h-8 w-8 text-blue-400 animate-bounce mb-1" />
          <p className="text-sm font-semibold text-white">Drop file to attach</p>
          <p className="text-xs text-slate-300">Supported: PDF • Markdown • TXT • DOCX</p>
          <p className="text-[11px] text-amber-400 font-medium">Maximum file size: 20 MB</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col space-y-2">
        {/* Toast Notice Banner */}
        {toastNotice && (
          <div
            className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium animate-in fade-in duration-150 shadow-md ${
              toastNotice.isError
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastNotice.isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-blue-400" />
              )}
              <span>{toastNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Attached Files Chips Bar */}
        {(attachedFiles.length > 0 || isUploading) && (
          <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
            {attachedFiles.map((att) => {
              const fileObj = att.file;
              if (!fileObj) return null;

              return (
                <div
                  key={att.id || att.fileId}
                  className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-blue-500/25 bg-[#0F172A]/90 backdrop-blur-md text-xs text-slate-200 shadow-sm transition-all hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    {getFileIcon(fileObj.extension)}
                    <span className="font-medium text-slate-200 truncate" title={fileObj.filename}>
                      {fileObj.filename}
                    </span>
                  </div>

                  {/* Future-proof attachment badge */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5 text-blue-400" />
                    <span>Context Ready</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => detachFile(att.fileId || fileObj.id)}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-0.5 rounded-lg transition-colors cursor-pointer ml-0.5"
                    title="Detach from conversation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Active Uploading Indicator Chip */}
            {isUploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span className="font-medium truncate max-w-[140px]">{uploadingFileName}</span>
                <span className="font-mono text-[11px] text-amber-400">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        {/* Floating Input Card Container */}
        <div className="relative flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#080D1A]/95 focus-within:border-[#3B82F6]/70 focus-within:ring-4 focus-within:ring-[#3B82F6]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2.5 transition-all duration-300 backdrop-blur-2xl">
          {/* Attachment Dropdown Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/[0.05] rounded-xl transition-all shrink-0 cursor-pointer"
                title="Attach Document"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-[#0F172A] border-white/10 text-slate-200">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="gap-2.5 text-xs cursor-pointer focus:bg-white/[0.08]"
              >
                <Upload className="h-4 w-4 text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">Upload New File</span>
                  <span className="text-[10px] text-slate-400">PDF, MD, DOCX, TXT • Max 20 MB</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowAttachModal(true)}
                className="gap-2.5 text-xs cursor-pointer focus:bg-white/[0.08]"
              >
                <Library className="h-4 w-4 text-indigo-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">Choose from Knowledge Base</span>
                  <span className="text-[10px] text-slate-400">Reuse saved documents</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden Native File Input with explicit accept attribute */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={FILE_ACCEPT_ATTRIBUTE}
            onChange={handleFileChange}
          />


          {/* Auto-Resizing Growing Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#F8FAFC] placeholder-slate-400/60 focus:outline-none resize-none py-1.5 px-1 font-normal leading-relaxed max-h-[220px]"
          />

          {/* Model Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] text-slate-300 select-none shrink-0">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span className="font-medium text-slate-200">OpenRouter (GPT-OSS)</span>
          </div>

          {/* Send / Stop Button */}
          {isGenerating || isStreaming ? (
            <button
              type="button"
              onClick={cancelGeneration}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
              title="Stop generating (Esc)"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || isUploading}
              className={`flex h-9 w-9 items-center justify-center rounded-xl font-medium transition-all duration-200 shrink-0 ${
                content.trim() && !isUploading
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.4)] hover:shadow-[0_0_24px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-white/[0.04] text-slate-500 border border-white/[0.04] cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Attach Existing File Modal */}
      {showAttachModal && (
        <AttachExistingModal
          conversationId={selectedConversationId}
          onClose={() => setShowAttachModal(false)}
          onAttach={async (fileId) => {
            const ok = await attachExistingFile(fileId);
            if (ok) {
              showToast('Document attached to conversation');
            }
            return ok;
          }}
        />
      )}
    </div>
  );
};
