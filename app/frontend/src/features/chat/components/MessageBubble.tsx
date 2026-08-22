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
        return <FileText className="h-4 w-4 text-rose-500" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-4 w-4 text-indigo-500" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-[var(--muted)]" />;
    }
  };

  // Render System Notification Message
  if (isSystem) {
    return (
      <div className="flex w-full justify-center py-2 animate-in fade-in">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-4 py-2 rounded-xl text-xs font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  // Render User Message
  if (isUser) {
    return (
      <div className="group relative flex w-full justify-end py-2 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex gap-3 max-w-2xl flex-row-reverse items-start">
          {/* User Avatar */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            <User className="h-4 w-4" />
          </div>

          <div className="flex flex-col space-y-1.5 items-end min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>You</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>

            {/* Inline Editing Mode or User Message Bubble */}
            {isEditingUserMsg ? (
              <div className="w-full flex flex-col gap-2 rounded-2xl p-3 shadow-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--primary)' }}>
                <textarea
                  value={userMsgContent}
                  onChange={(e) => setUserMsgContent(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-sm focus:outline-none resize-none leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMsgContent(message.content);
                      setIsEditingUserMsg(false);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: 'var(--muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSubmit}
                    disabled={isGenerating || !userMsgContent.trim()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                    }}
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed break-words shadow-2xs font-sans"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
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
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs font-medium shadow-2xs transition-all hover:scale-[1.02] cursor-pointer select-none"
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
                            <span className="text-[10px] opacity-80 font-mono">
                              {formatBytes(fileObj.size)}
                            </span>
                          ) : null}

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded ml-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Context Ready</span>
                          </span>

                          {loadingFileId === (att.fileId || fileObj?.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3 w-3 opacity-80 group-hover:opacity-100 transition-opacity" />
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 pt-1" style={{ color: 'var(--muted)' }}>
                {isLatestUserMessage && (
                  <button
                    onClick={() => {
                      setUserMsgContent(message.content);
                      setIsEditingUserMsg(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all text-[11px] cursor-pointer active:scale-95"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    title="Edit prompt"
                  >
                    <Pencil className="h-3 w-3 text-[var(--primary)]" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopy()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all text-[11px] cursor-pointer active:scale-95"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                  title="Copy text"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-[var(--primary)]" />
                      <span className="font-semibold" style={{ color: 'var(--primary)' }}>Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" style={{ color: 'var(--muted)' }} />
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

  // Render Assistant Message (Open Document-Style Layout Blending Seamlessly into Canvas)
  return (
    <div className="group relative flex w-full py-4 px-2 sm:px-4 transition-all animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-3.5 w-full flex-row items-start">
        {/* Assistant Avatar */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs border mt-0.5"
          style={{
            backgroundColor: 'var(--primary-muted)',
            borderColor: 'var(--primary-border)',
            color: 'var(--primary)',
          }}
        >
          <Sparkles className="h-4 w-4" />
        </div>

        {/* Unified Assistant Message Content Area */}
        <div className="flex flex-col space-y-3 flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Synapse AI</span>
            <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>

          {/* Thinking State vs Markdown Content */}
          {isStreamingMessage && message.content.trim() === '' ? (
            <div className="flex items-center gap-2 text-xs font-medium py-1.5 select-none animate-pulse" style={{ color: 'var(--primary)' }}>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: 'var(--primary)' }} />
              <span>Synapse AI is thinking...</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed break-words font-sans" style={{ color: 'var(--text-primary)' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 pb-1.5 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mb-2.5 mt-3.5 first:mt-0" style={{ color: 'var(--text-primary)' }}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0" style={{ color: 'var(--text-primary)' }}>
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm font-semibold mb-1.5 mt-2.5 first:mt-0" style={{ color: 'var(--text-primary)' }}>
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0" style={{ color: 'var(--text-primary)' }}>{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>,
                  em: ({ children }) => <em className="italic" style={{ color: 'var(--text-secondary)' }}>{children}</em>,
                  del: ({ children }) => <del className="line-through" style={{ color: 'var(--muted)' }}>{children}</del>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-5 mb-3 space-y-1" style={{ color: 'var(--text-primary)' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1" style={{ color: 'var(--text-primary)' }}>{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed pl-1" style={{ color: 'var(--text-primary)' }}>{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 pl-4 py-2 pr-3 my-3 italic rounded-r-lg" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4" style={{ borderColor: 'var(--border)' }} />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <table className="min-w-full divide-y text-xs sm:text-sm" style={{ borderColor: 'var(--border)' }}>{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>{children}</tbody>,
                  tr: ({ children }) => <tr className="transition-colors hover:bg-[var(--surface-hover)]">{children}</tr>,
                  th: ({ children }) => (
                    <th className="px-3.5 py-2.5 text-left font-semibold border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => <td className="px-3.5 py-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>{children}</td>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 transition-colors font-medium"
                      style={{ color: 'var(--primary)' }}
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className || !className.includes('hljs');
                    if (isInline) {
                      return (
                        <code
                          className="border rounded px-1.5 py-0.5 font-mono text-xs font-normal"
                          style={{
                            backgroundColor: 'var(--code-inline-bg)',
                            borderColor: 'var(--code-inline-border)',
                            color: 'var(--code-inline-text)',
                          }}
                        >
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
                <span className="inline-block w-2 h-4 ml-1 animate-pulse rounded-full align-middle" style={{ backgroundColor: 'var(--primary)' }} />
              )}
            </div>
          )}

          {/* Memory Auto-Save Notification Toast */}
          {(message.metadata as any)?.memoryFeedback?.toastMessage && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold shadow-2xs animate-in fade-in duration-200"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              <Brain className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
              <span>{(message.metadata as any).memoryFeedback.toastMessage}</span>
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
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--muted)' }}>
              {/* Copy Button */}
              <button
                onClick={() => handleCopy()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-[11px] cursor-pointer active:scale-95"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                    <span className="font-semibold" style={{ color: 'var(--primary)' }}>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" style={{ color: 'var(--muted)' }} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Like Button */}
              <button
                onClick={() => handleToggleRating('like')}
                className="p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: currentRating === 'like' ? 'var(--primary-muted)' : 'var(--surface)',
                  borderColor: currentRating === 'like' ? 'var(--primary-border)' : 'var(--border)',
                  color: currentRating === 'like' ? 'var(--primary)' : 'var(--muted)',
                }}
                title="Helpful response"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>

              {/* Dislike Button */}
              <button
                onClick={() => handleToggleRating('dislike')}
                className="p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: currentRating === 'dislike' ? 'rgba(225,29,72,0.1)' : 'var(--surface)',
                  borderColor: currentRating === 'dislike' ? 'rgba(225,29,72,0.3)' : 'var(--border)',
                  color: currentRating === 'dislike' ? '#E11D48' : 'var(--muted)',
                }}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>

              {/* Regenerate Button */}
              <button
                onClick={() => regenerateResponse()}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-[11px] cursor-pointer active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
                title="Regenerate response"
              >
                <RotateCcw className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                <span>Regenerate</span>
              </button>

              {/* More Options Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--muted)',
                  }}
                  title="More options"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>

                {showMoreMenu && (
                  <div
                    className="absolute left-0 top-full mt-1.5 z-30 w-44 rounded-xl border p-1.5 shadow-xl backdrop-blur-xl animate-in fade-in duration-100"
                    style={{
                      backgroundColor: 'var(--dropdown)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        try {
                          await createMemoryApi(message.conversationId, message.content.slice(0, 250), 'fact');
                        } catch (err) {
                          console.error('Failed to remember message:', err);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Brain className="h-3.5 w-3.5 text-[var(--primary)]" />
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
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Globe className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>Remember to Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleCopy(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Copy className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>{copiedRaw ? 'Copied ✓' : 'Copy Raw Markdown'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        deleteMessage(message.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
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
