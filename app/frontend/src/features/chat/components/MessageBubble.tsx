import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import {
  User,
  Sparkles,
  Copy,
  RotateCcw,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Check,
  Trash2,
  FileText,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Brain,
  Globe,
} from 'lucide-react';


import { formatRelativeTime } from '@/utils/time';
import { CodeBlock } from './CodeBlock';
import { CitationsList } from './CitationsList';
import { useChat } from '../context/chatContext';
import { FilePreviewModal } from '../../files/components/FilePreviewModal';
import { getFileApi } from '../../files/services/files.api';
import { createMemoryApi } from '../services/memory.api';
import { createWorkspaceMemoryApi } from '../services/workspace-memory.api';
import { formatBytes, getExtensionBadgeProps } from '../../files/utils/fileHelpers';

import type { KnowledgeFile } from '../../files/types/files.types';
import type { Message, MessageMetadata } from '../chat.types';

interface MessageBubbleProps {
  message: Message;
  isLatestUserMessage?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLatestUserMessage = true }) => {
  const {
    updateMessage,
    deleteMessage,
    regenerateResponse,
    editUserMessageAndSubmit,
    isGenerating,
  } = useChat();

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreamingMessage = !isUser && message.id.startsWith('temp-assistant-');

  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isEditingUserMsg, setIsEditingUserMsg] = useState(false);
  const [userMsgContent, setUserMsgContent] = useState(message.content);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Sync user message content if updated externally
  useEffect(() => {
    setUserMsgContent(message.content);
  }, [message.content]);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Copy handler
  const handleCopy = async (raw = false) => {
    try {
      await navigator.clipboard.writeText(message.content);
      if (raw) {
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  // Rating handlers (Likes / Dislikes)
  const currentRating = (message.metadata as { rating?: 'like' | 'dislike' })?.rating || null;

  const handleToggleRating = (newRating: 'like' | 'dislike') => {
    const nextRating = currentRating === newRating ? null : newRating;
    updateMessage(message.id, {
      metadata: {
        ...(message.metadata || {}),
        rating: nextRating,
      },
    });
  };

  // Submit edited user prompt
  const handleEditSubmit = () => {
    if (userMsgContent.trim() && userMsgContent.trim() !== message.content) {
      editUserMessageAndSubmit(message.id, userMsgContent.trim());
    }
    setIsEditingUserMsg(false);
  };

  // Attachment preview handler
  const handlePreviewAttachment = async (fileId: string) => {
    try {
      setLoadingFileId(fileId);
      const res = await getFileApi(fileId);
      if (res?.data) {
        setPreviewFile(res.data);
      }
    } catch (err) {
      console.error('Failed to load attachment file preview:', err);
    } finally {
      setLoadingFileId(null);
    }
  };

  const getFileIcon = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-400" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-4 w-4 text-indigo-400" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-4 w-4 text-blue-400" />;
      default:
        return <FileIcon className="h-4 w-4 text-slate-300" />;
    }
  };

  // Render System Notification Message
  if (isSystem) {
    return (
      <div className="flex w-full justify-center py-2 animate-in fade-in">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-2 rounded-xl text-xs font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  // Render User Message
  if (isUser) {
    return (
      <div className="group relative flex w-full justify-end py-1 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex gap-3 max-w-3xl flex-row-reverse items-start">
          {/* User Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white font-bold text-xs shadow-md ring-2 ring-[#3B82F6]/30">
            <User className="h-4 w-4" />
          </div>

          <div className="flex flex-col space-y-1.5 items-end min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F8FAFC]">You</span>
              <span className="text-[10px] text-[#94A3B8] font-normal">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>

            {/* Inline Editing Mode or User Message Bubble */}
            {isEditingUserMsg ? (
              <div className="w-full flex flex-col gap-2 bg-[#020617] border border-blue-500/60 rounded-2xl p-3 shadow-xl">
                <textarea
                  value={userMsgContent}
                  onChange={(e) => setUserMsgContent(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-sm text-white focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMsgContent(message.content);
                      setIsEditingUserMsg(false);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSubmit}
                    disabled={isGenerating || !userMsgContent.trim()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed break-words bg-[#3B82F6] text-white shadow-[0_4px_16px_rgba(59,130,246,0.25)]">
                {/* Message Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2.5 pb-2 border-b border-white/20">
                    {message.attachments.map((att) => {
                      const fileObj = att.file;
                      const badgeProps = getExtensionBadgeProps(fileObj?.extension || 'file');

                      return (
                        <div
                          key={att.id || att.fileId}
                          onClick={() => handlePreviewAttachment(att.fileId || fileObj?.id)}
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-xs text-white font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-white/25 cursor-pointer select-none"
                          title="Click to preview file"
                        >
                          <div className="flex items-center gap-1.5">
                            {getFileIcon(fileObj?.extension)}
                            <span className="font-semibold truncate max-w-[170px]" title={fileObj?.filename}>
                              {fileObj?.filename || 'Attached File'}
                            </span>
                          </div>

                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeProps.colorClass}`}>
                            {badgeProps.label}
                          </span>

                          {fileObj?.size ? (
                            <span className="text-[10px] text-blue-100 font-mono">
                              {formatBytes(fileObj.size)}
                            </span>
                          ) : null}

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 ml-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-300" />
                            <span>Context Ready</span>
                          </span>

                          {loadingFileId === (att.fileId || fileObj?.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                          ) : (
                            <ExternalLink className="h-3 w-3 text-blue-200 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            )}

            {/* User Action Bar */}
            {!isEditingUserMsg && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 pt-1 text-slate-400">
                {isLatestUserMessage && (
                  <button
                    onClick={() => {
                      setUserMsgContent(message.content);
                      setIsEditingUserMsg(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer active:scale-95"
                    title="Edit prompt"
                  >
                    <Pencil className="h-3 w-3 text-blue-400" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopy()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer active:scale-95"
                  title="Copy text"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Attachment Source Preview Modal */}
        {previewFile && (
          <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </div>
    );
  }

  // Render Assistant Message (Single Unified Component — Transitioning Thinking → Streaming → Completed)
  return (
    <div className="group relative flex w-full py-4 px-4 sm:px-6 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-3.5 max-w-3xl w-full flex-row items-start">
        {/* Assistant Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md ring-2 ring-[#A855F7]/30 mt-0.5">
          <Sparkles className="h-4 w-4" />
        </div>

        {/* Unified Assistant Message Area */}
        <div className="flex flex-col space-y-3 flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F8FAFC]">Synapse AI</span>
            <span className="text-[10px] text-[#94A3B8] font-normal">
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>

          {/* Thinking State vs Markdown Content (Seamless single-component transition) */}
          {isStreamingMessage && message.content.trim() === '' ? (
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 py-1.5 select-none animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
              <span>Synapse AI is thinking...</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-[#F8FAFC] break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0 pb-1.5 border-b border-white/10">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-white mb-2.5 mt-3.5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-slate-100 mb-2 mt-3 first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm font-semibold text-slate-200 mb-1.5 mt-2.5 first:mt-0">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-200 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                  del: ({ children }) => <del className="line-through text-slate-400">{children}</del>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-slate-200">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-slate-200">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed text-slate-200 pl-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#3B82F6]/70 bg-white/[0.03] pl-4 py-2 pr-3 my-3 text-slate-300 italic rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-white/10 my-4" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-white/10 bg-[#090D16]/60 shadow-lg">
                      <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-white/[0.05] font-semibold text-white">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.04] text-slate-300">{children}</tbody>,
                  tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.02]">{children}</tr>,
                  th: ({ children }) => (
                    <th className="px-3.5 py-2.5 text-left font-semibold text-slate-200 border-b border-white/10">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => <td className="px-3.5 py-2 text-slate-300 border-b border-white/[0.04]">{children}</td>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3B82F6] hover:text-[#60A5FA] underline underline-offset-4 transition-colors font-medium"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className || !className.includes('hljs');
                    if (isInline) {
                      return (
                        <code className="bg-slate-800/90 border border-white/10 rounded px-1.5 py-0.5 font-mono text-xs text-sky-300 font-normal">
                          {children}
                        </code>
                      );
                    }
                    return <code className={className}>{children}</code>;
                  },
                  pre: ({ children, className }) => <CodeBlock className={className}>{children}</CodeBlock>,
                }}
              >
                {message.content}
              </ReactMarkdown>

              {isStreamingMessage && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#3B82F6] animate-pulse rounded-full align-middle shadow-[0_0_8px_#3B82F6]" />
              )}
            </div>
          )}

          {/* RAG Citations & Context Engine Inspector */}
          {((message.metadata as MessageMetadata)?.citations || (message.metadata as MessageMetadata)?.strategyMeta) && (
            <CitationsList
              citations={(message.metadata as MessageMetadata).citations || []}
              retrievedChunksCount={(message.metadata as MessageMetadata).retrievedChunksCount}
              retrievedTokensCount={(message.metadata as MessageMetadata).retrievedTokensCount}
              strategyMeta={(message.metadata as MessageMetadata).strategyMeta}
              hasRAGContext={(message.metadata as MessageMetadata).hasRAGContext}
            />
          )}

          {/* Assistant Action Bar */}
          {!isStreamingMessage && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 pt-2 border-t border-white/[0.06] text-slate-400">
              {/* Copy Button */}
              <button
                onClick={() => handleCopy()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer active:scale-95"
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Like Button */}
              <button
                onClick={() => handleToggleRating('like')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                  currentRating === 'like'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Helpful response"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>

              {/* Dislike Button */}
              <button
                onClick={() => handleToggleRating('dislike')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                  currentRating === 'dislike'
                    ? 'border-rose-500/40 bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>

              {/* Regenerate Button */}
              <button
                onClick={() => regenerateResponse()}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer active:scale-95 disabled:opacity-50"
                title="Regenerate response"
              >
                <RotateCcw className="h-3 w-3 text-indigo-400" />
                <span>Regenerate</span>
              </button>

              {/* More Options Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="More options"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>

                {showMoreMenu && (
                  <div className="absolute left-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-white/10 bg-[#0B0F17] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-100">
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        try {
                          await createMemoryApi(message.conversationId, message.content.slice(0, 250), 'fact', true);
                        } catch (err) {
                          console.error('Failed to remember message:', err);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/15 transition-colors cursor-pointer"
                    >
                      <Brain className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Remember snippet</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        try {
                          await createWorkspaceMemoryApi(message.content.slice(0, 500), 'fact');
                        } catch (err) {
                          console.error('Failed to remember snippet to workspace:', err);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                    >
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Remember to Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleCopy(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-blue-400" />
                      <span>{copiedRaw ? 'Copied ✓' : 'Copy Raw Markdown'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        deleteMessage(message.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Delete Message</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};
