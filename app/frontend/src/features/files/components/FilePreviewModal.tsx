import { useState, useEffect } from 'react';
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
        if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
          const res = await getFilePreviewTextApi(file.id);
          if (isMounted) {
            setTextContent(res.data.content);
            if (res.data.chunks) {
              setChunks(res.data.chunks);
            }
          }
        } else if (ext === 'pdf') {
          const blob = await getFilePreviewBlobApi(file.id);
          if (isMounted) {
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50">
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground truncate" title={file.filename}>
                  {file.filename}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${extProps.colorClass}`}>
                  {extProps.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFileApi(file.id, file.filename)}
              className="gap-1.5 text-xs border-white/10 text-slate-200 hover:bg-white/[0.08]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab & Processing Metadata Sub-Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/80 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === 'preview' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Raw Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chunks')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === 'chunks' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Parsed Chunks ({chunks.length})</span>
            </button>
          </div>

          {file.status === 'processed' && (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading document content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
              <p className="text-sm font-medium text-rose-400">Unable to preview file</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : activeTab === 'chunks' ? (
            /* Parsed Semantic Chunks View */
            <div className="space-y-4">
              {chunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-xs">
                  No extracted chunks found for this file yet.
                </div>
              ) : (
                chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-2 hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/[0.04] pb-2">
                      <span className="font-semibold text-blue-400">Chunk #{chunk.chunkIndex + 1}</span>
                      <div className="flex items-center gap-3">
                        {chunk.page && <span>Page {chunk.page}</span>}
                        <span>~{chunk.tokenEstimate} tokens</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : ext === 'md' || ext === 'markdown' ? (
            <div className="prose prose-invert prose-slate max-w-none text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {textContent || ''}
              </ReactMarkdown>
            </div>
          ) : ext === 'txt' ? (
            <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words border border-white/[0.06]">
              {textContent}
            </pre>
          ) : ext === 'pdf' && pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              title={file.filename}
              className="w-full h-[60vh] rounded-xl border border-white/[0.08]"
            />
          ) : (
            /* DOCX or binary document text view */
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Structured Document Extracted</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Word document parsed into {chunks.length} structured semantic chunks (~{file.tokenCount || 0} tokens). Switch to the "Parsed Chunks" tab to inspect extracted text blocks.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-slate-300 bg-slate-950 px-4 py-2 rounded-lg border border-white/[0.06]">
                Filename: {file.filename} • Size: {formatBytes(file.size)} • Extension: .{file.extension}
              </div>
            </div>
          )}
        </div>

        {/* Referenced In Section */}
        {file.conversations && file.conversations.length > 0 && (
          <div className="px-6 py-3 border-t border-white/[0.08] bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
              <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-300">Referenced In:</span>
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
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 hover:text-white transition-all cursor-pointer"
                >
                  <Check className="h-3 w-3 text-blue-400" />
                  <span className="font-medium">{c.conversation.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
