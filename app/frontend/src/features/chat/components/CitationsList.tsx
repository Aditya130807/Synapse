import React, { useState, useMemo } from 'react';
import { FileText, FileCode, FileSpreadsheet, ChevronDown, ChevronUp, Sparkles, Terminal, ArrowUpRight, Loader2, Cpu } from 'lucide-react';

import type { MessageCitation, ContextStrategyMeta } from '../chat.types';
import { FilePreviewModal } from '../../files/components/FilePreviewModal';
import { getFileApi } from '../../files/services/files.api';
import type { KnowledgeFile } from '../../files/types/files.types';

interface CitationsListProps {
  citations: MessageCitation[];
  retrievedChunksCount?: number;
  retrievedTokensCount?: number;
  strategyMeta?: ContextStrategyMeta;
  hasRAGContext?: boolean;
}

export const CitationsList: React.FC<CitationsListProps> = ({
  citations,
  retrievedChunksCount,
  retrievedTokensCount,
  strategyMeta,
  hasRAGContext,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  // Group citations by document/file for user-facing presentation
  const sourceSummaries = useMemo(() => {
    if (!citations || citations.length === 0) return [];

    const map = new Map<string, {
      fileId: string;
      filename: string;
      extension: string;
      chunkCount: number;
      maxScorePercent: number;
      sourceOrigin?: string;
      chunks: MessageCitation[];
    }>();

    citations.forEach((cit) => {
      const key = cit.fileId || cit.filename;
      const ext = cit.filename ? cit.filename.split('.').pop() || '' : '';
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          fileId: cit.fileId,
          filename: cit.filename,
          extension: ext,
          chunkCount: 1,
          maxScorePercent: cit.scorePercent || 0,
          sourceOrigin: cit.sourceOrigin,
          chunks: [cit],
        });
      } else {
        existing.chunkCount += 1;
        existing.chunks.push(cit);
        if ((cit.scorePercent || 0) > existing.maxScorePercent) {
          existing.maxScorePercent = cit.scorePercent || 0;
        }
      }
    });

    return Array.from(map.values());
  }, [citations]);

  // No citations — show Normal AI indicator when we have strategy metadata
  if (!citations || citations.length === 0) {
    if (hasRAGContext === false && strategyMeta) {
      return (
        <div className="mt-2 pt-2 border-t w-full space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              <Cpu className="h-3 w-3" style={{ color: 'var(--muted)' }} />
              <span>Context Mode:</span>
              <span className="px-1.5 py-0.5 rounded border text-[10px] font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Normal AI
              </span>
              <span>·</span>
              <span>No retrieval</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer"
              style={{
                backgroundColor: showInspector ? 'var(--primary-muted)' : 'var(--surface)',
                borderColor: showInspector ? 'var(--primary-border)' : 'var(--border)',
                color: showInspector ? 'var(--primary)' : 'var(--muted)',
              }}
              title="Toggle Context Engine Inspector"
            >
              <Terminal className="h-2.5 w-2.5" />
              <span>{showInspector ? 'Hide' : 'Inspector'}</span>
            </button>
          </div>

          {showInspector && (
            <div className="p-3 rounded-xl border text-xs font-mono space-y-2.5 animate-in fade-in duration-150 shadow-xs" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                <span className="font-bold flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  CONTEXT ENGINE INSPECTOR
                </span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>0 Chunks · Normal AI Mode</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Provider / Model</span>
                  <p className="font-bold truncate font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>
                    {strategyMeta.agentMeta?.provider || 'omniroute'} / {strategyMeta.agentMeta?.selectedModel || strategyMeta.agentMeta?.resolvedModel || 'auto/best-fast'}
                  </p>
                </div>
                <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Orchestration Agent</span>
                  <p className="font-bold font-mono text-[10px]" style={{ color: 'var(--primary)' }}>
                    {strategyMeta.agentMeta?.emergencyFallback
                      ? `${strategyMeta.agentMeta.requestedAgent || 'specialized'} ➔ General`
                      : strategyMeta.agentMeta?.agentName || 'General Agent'}
                  </p>
                </div>
                <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Execution Time</span>
                  <p className="font-bold font-mono text-[10px]" style={{ color: 'var(--primary)' }}>
                    {strategyMeta.agentMeta ? `${(strategyMeta.agentMeta.durationMs / 1000).toFixed(2)}s` : 'Direct'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  const handleOpenSource = async (fileId: string) => {
    try {
      setLoadingFileId(fileId);
      const res = await getFileApi(fileId);
      if (res?.data) {
        setSelectedFile(res.data);
      }
    } catch (err) {
      console.error('Failed to load citation source file:', err);
    } finally {
      setLoadingFileId(null);
    }
  };

  const getStrategyBadge = (strat?: string) => {
    switch (strat) {
      case 'attached-document':
        return { label: 'Full Document Inject', color: 'style-primary' };
      case 'large-document':
        return { label: 'Compressed Document', color: 'style-primary' };
      case 'hybrid':
        return { label: 'Hybrid Search Mode', color: 'style-primary' };
      case 'conversation':
      default:
        return { label: 'Semantic Search', color: 'style-primary' };
    }
  };

  const getFileIcon = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-rose-500" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-3.5 w-3.5 text-indigo-500" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />;
    }
  };

  const badge = getStrategyBadge(strategyMeta?.strategy);

  return (
    <div className="mt-3 pt-3 border-t w-full space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
      {/* Accordion Header */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 font-semibold transition-colors cursor-pointer select-none"
            style={{ color: 'var(--text-primary)' }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
            <span>Knowledge Sources ({sourceSummaries.length})</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-[var(--muted)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" />}
          </button>

          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border"
            style={{
              backgroundColor: 'var(--primary-muted)',
              borderColor: 'var(--primary-border)',
              color: 'var(--primary)',
            }}
          >
            {badge.label}
          </span>
        </div>

        {/* Developer Retrieval Inspector Toggle */}
        <button
          type="button"
          onClick={() => setShowInspector(!showInspector)}
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer"
          style={{
            backgroundColor: showInspector ? 'var(--primary-muted)' : 'var(--surface)',
            borderColor: showInspector ? 'var(--primary-border)' : 'var(--border)',
            color: showInspector ? 'var(--primary)' : 'var(--muted)',
          }}
          title="Toggle Context Engine Inspector"
        >
          <Terminal className="h-3 w-3" />
          <span>{showInspector ? 'Hide Inspector' : 'Retrieval Inspector'}</span>
        </button>
      </div>

      {/* Citations List (Document-Level Sources with White/Clean Surface) */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {sourceSummaries.map((src, idx) => (
            <div
              key={`${src.fileId}-${idx}`}
              onClick={() => handleOpenSource(src.fileId)}
              className="group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              title={`Click to preview ${src.filename}`}
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 border"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {getFileIcon(src.extension)}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-medium truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {src.filename}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    {src.chunkCount} {src.chunkCount === 1 ? 'chunk' : 'chunks'} used
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span
                  className="inline-flex items-center text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'var(--primary-muted)',
                    borderColor: 'var(--primary-border)',
                    color: 'var(--primary)',
                  }}
                >
                  {src.maxScorePercent}% match
                </span>
                {loadingFileId === src.fileId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--primary)' }} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 transition-colors" style={{ color: 'var(--muted)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Engine Inspector Panel */}
      {showInspector && (
        <div
          className="p-3.5 rounded-xl border text-xs font-mono space-y-3 animate-in fade-in duration-150 shadow-sm"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <Cpu className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              CONTEXT ENGINE INSPECTOR
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {retrievedChunksCount || citations.length} Chunks Injected • ~{retrievedTokensCount || 0} Tokens Used
            </span>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Context Strategy</span>
              <p className="font-bold capitalize" style={{ color: 'var(--primary)' }}>{strategyMeta?.strategy || 'Conversation'}</p>
            </div>
            <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Prior Attachments</span>
              <p className="font-bold" style={{ color: strategyMeta?.previousContextUsed ? 'var(--primary)' : 'var(--muted)' }}>
                {strategyMeta?.previousContextUsed ? 'Yes (Expanded Scope)' : 'No (Message Priority)'}
              </p>
            </div>
            <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Chunks Loaded</span>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {strategyMeta ? `${strategyMeta.chunksInjected} / ${strategyMeta.totalChunksAvailable}` : `${citations.length}`}
              </p>
            </div>
            <div className="p-2 rounded-lg border space-y-0.5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Semantic Search</span>
              <p className="font-bold" style={{ color: strategyMeta?.semanticSearchEnabled ? 'var(--primary)' : 'var(--muted)' }}>
                {strategyMeta?.semanticSearchEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Source Preview Modal */}
      {selectedFile && (
        <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
};
