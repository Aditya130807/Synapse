import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { X, FileText, Download, Loader2, MessageSquare, Check, Layers, FileCode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { KnowledgeFile, KnowledgeChunk } from '../types/files.types';
import { getFilePreviewTextApi, getFilePreviewBlobApi, downloadFileApi } from '../services/files.api';
import { formatBytes, getExtensionBadgeProps } from '../utils/fileHelpers';

interface FilePreviewModalProps {
  file: KnowledgeFile | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'chunks'>('preview');

  const [textContent, setTextContent] = useState<string | null>(null);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent background body scroll & support Escape key to close modal
  useEffect(() => {
    if (!file) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [file, onClose]);

  // Load document text content & chunks
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setTextContent(null);
    setPdfBlobUrl(null);
    setChunks(file.chunks || []);

    const ext = file.extension.toLowerCase();

    async function loadContent() {
      try {
        if (!file) return;

        // Fetch parsed text preview & chunks for all document types
        const res = await getFilePreviewTextApi(file.id);
        if (isMounted) {
          setTextContent(res.data.content || null);
          if (res.data.chunks && res.data.chunks.length > 0) {
            setChunks(res.data.chunks);
          }
        }

        // For PDF files, also fetch blob URL for iframe view
        if (ext === 'pdf') {
          try {
            const blob = await getFilePreviewBlobApi(file.id);
            if (isMounted) {
              const url = URL.createObjectURL(blob);
              setPdfBlobUrl(url);
            }
          } catch {
            // If blob fetch fails, fallback to extracted text content
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load preview');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      isMounted = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [file]);

  if (!file) return null;

  const extProps = getExtensionBadgeProps(file.extension);
  const ext = file.extension.toLowerCase();

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[85vh] sm:h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--modal)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 truncate min-w-0 pr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 shadow-sm" style={{ backgroundColor: 'var(--primary-muted)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-2">
                <h3
                  id="document-preview-modal-title"
                  className="text-base font-bold truncate tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                  title={file.filename}
                >
                  {file.filename}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${extProps.colorClass}`}>
                  {extProps.label}
                </span>
              </div>
              <p className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
                {formatBytes(file.size)} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFileApi(file.id, file.filename)}
              className="gap-1.5 text-xs rounded-xl cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Download className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
              <span>Download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl cursor-pointer"
              style={{ color: 'var(--muted)' }}
              title="Close modal (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab & Processing Metadata Sub-Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b text-xs shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium"
              style={
                activeTab === 'preview'
                  ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }
                  : { color: 'var(--muted)' }
              }
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Raw Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chunks')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium"
              style={
                activeTab === 'chunks'
                  ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }
                  : { color: 'var(--muted)' }
              }
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Parsed Chunks ({chunks.length})</span>
            </button>
          </div>

          {file.status === 'processed' && (
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--primary)' }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready
              </span>
              <span>•</span>
              <span>Pages: {file.pageCount || 1}</span>
              <span>•</span>
              <span>Tokens: {file.tokenCount || 0}</span>
              {file.processedAt && (
                <>
                  <span>•</span>
                  <span>Processed: {new Date(file.processedAt).toLocaleTimeString()}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Body (Independently Scrollable Container) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px] select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading document content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
              <p className="text-sm font-medium text-rose-500 dark:text-rose-400">Unable to preview file</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{error}</p>
            </div>
          ) : activeTab === 'chunks' ? (
            /* Parsed Semantic Chunks View */
            <div className="space-y-4">
              {chunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-xs" style={{ color: 'var(--muted)' }}>
                  No extracted chunks found for this file yet.
                </div>
              ) : (
                chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-2xl border space-y-2 transition-all"
                    style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono border-b pb-2" style={{ borderColor: 'var(--border-subtle)', color: 'var(--muted)' }}>
                      <span className="font-semibold" style={{ color: 'var(--primary)' }}>Chunk #{chunk.chunkIndex + 1}</span>
                      <div className="flex items-center gap-3">
                        {chunk.page && <span>Page {chunk.page}</span>}
                        <span>~{chunk.tokenEstimate} tokens</span>
                      </div>
                    </div>
                    <p className="text-xs font-sans whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : ext === 'md' || ext === 'markdown' ? (
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {textContent || ''}
              </ReactMarkdown>
            </div>
          ) : ext === 'txt' ? (
            <pre className="p-4 rounded-2xl font-mono text-xs whitespace-pre-wrap break-words border" style={{ backgroundColor: 'var(--code-bg)', borderColor: 'var(--code-border)', color: 'var(--code-text)' }}>
              {textContent}
            </pre>
          ) : ext === 'pdf' && pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              title={file.filename}
              className="w-full h-[60vh] rounded-2xl border"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : textContent ? (
            /* DOCX / DOC or extracted document text view */
            <div className="p-6 rounded-2xl border shadow-inner space-y-4" style={{ backgroundColor: 'var(--code-bg)', borderColor: 'var(--code-border)' }}>
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  <FileText className="h-4 w-4" />
                  <span>Document Extracted Reader View</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  {file.tokenCount ? `~${file.tokenCount} tokens` : ''}
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--text-primary)' }}>
                {textContent}
              </div>
            </div>
          ) : (
            /* Fallback state when processing is pending, failed, or text unavailable */
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--empty-bg)', borderColor: 'var(--border)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ backgroundColor: 'var(--primary-muted)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {file.status === 'processing' ? 'Processing Document...' : 'Raw Preview Unavailable'}
                </h4>
                <p className="text-xs max-w-md" style={{ color: 'var(--muted)' }}>
                  {file.status === 'processing'
                    ? 'Synapse AI is currently extracting and chunking document text.'
                    : 'A raw visual preview is not supported for this file format. You can download the original file.'}
                </p>
              </div>
              <div className="pt-2 text-xs font-mono px-4 py-2 rounded-lg border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Filename: {file.filename} • Size: {formatBytes(file.size)} • Status: {file.status}
              </div>
            </div>
          )}
        </div>

        {/* Referenced In Section */}
        {file.conversations && file.conversations.length > 0 && (
          <div className="px-6 py-3 border-t flex items-center justify-between gap-4 shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: 'var(--muted)' }}>
              <MessageSquare className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Referenced In:</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center overflow-x-auto max-w-xl">
              {file.conversations.map((c) => (
                <button
                  key={c.conversation.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/chat?id=${c.conversation.id}`);
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary-muted)',
                    borderColor: 'var(--primary-border)',
                    color: 'var(--primary)',
                  }}
                >
                  <Check className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                  <span className="font-medium">{c.conversation.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
