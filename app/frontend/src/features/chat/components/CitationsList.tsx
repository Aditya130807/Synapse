import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Sparkles, Terminal, ArrowUpRight, Loader2, Cpu, CheckCircle2, Brain, Pin, Globe } from 'lucide-react';


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

  // No citations — show Normal AI indicator when we have strategy metadata
  if (!citations || citations.length === 0) {
    if (hasRAGContext === false && strategyMeta) {
      return (
        <div className="mt-2 pt-2 border-t border-white/[0.06] w-full space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <Cpu className="h-3 w-3 text-slate-600" />
              <span className="text-slate-500">Context Mode:</span>
              <span className="px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-slate-800/60 border-slate-600/40 text-slate-400">
                Normal AI
              </span>
              <span className="text-slate-700 mx-0.5">·</span>
              <span className="text-slate-600">No retrieval</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInspector(!showInspector)}
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                showInspector
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/[0.03] border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20'
              }`}
              title="Toggle Context Engine Inspector"
            >
              <Terminal className="h-2.5 w-2.5" />
              <span>{showInspector ? 'Hide' : 'Inspector'}</span>
            </button>
          </div>

          {showInspector && (
            <div className="p-3 rounded-xl border border-slate-700/40 bg-[#090D16]/95 backdrop-blur-md text-xs font-mono space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-blue-400 border-b border-white/10 pb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  CONTEXT ENGINE INSPECTOR
                </span>
                <span className="text-[10px] text-slate-500">0 Chunks · Normal AI Mode</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 text-[10px]">Context Mode</span>
                  <p className="font-bold text-slate-300">Normal AI</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 text-[10px]">Orchestration Agent</span>
                  <p className="font-bold text-blue-400">{strategyMeta.agentMeta?.agentName || 'General Agent'}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 text-[10px]">Execution Time</span>
                  <p className="font-bold text-emerald-400">
                    {strategyMeta.agentMeta ? `${(strategyMeta.agentMeta.durationMs / 1000).toFixed(2)}s` : 'Direct'}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/70 border border-white/5 text-[11px] space-y-0.5">
                <span className="text-slate-500 text-[10px]">Routing & Reason:</span>
                <p className="text-slate-400 font-sans italic mt-0.5">
                  {strategyMeta.agentMeta?.routingReason || strategyMeta.previousContextReason || 'No document context — direct AI generation.'}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  const handleOpenSource = async (citation: MessageCitation) => {
    try {
      setLoadingFileId(citation.fileId);
      const res = await getFileApi(citation.fileId);
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
        return { label: 'Full Document Inject', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'large-document':
        return { label: 'Compressed Document', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'hybrid':
        return { label: 'Hybrid Search Mode', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'conversation':
      default:
        return { label: 'Semantic Search', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    }
  };

  const badge = getStrategyBadge(strategyMeta?.strategy);

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.08] w-full space-y-2">
      {/* Accordion Header */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Knowledge Sources ({citations.length})</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Developer Retrieval Inspector Toggle */}
        <button
          type="button"
          onClick={() => setShowInspector(!showInspector)}
          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
            showInspector
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Context Engine Inspector"
        >
          <Terminal className="h-3 w-3" />
          <span>{showInspector ? 'Hide Inspector' : 'Retrieval Inspector'}</span>
        </button>
      </div>

      {/* Citations List */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {citations.map((cit, idx) => (
            <div
              key={`${cit.fileId}-${cit.chunkId}-${idx}`}
              onClick={() => handleOpenSource(cit)}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-white/[0.06] bg-slate-950/60 hover:bg-slate-900/90 hover:border-blue-500/40 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 shrink-0 border border-blue-500/20">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                    {cit.filename}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {cit.page ? `Page ${cit.page}` : `Chunk #${cit.chunkIndex + 1}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="inline-flex items-center text-[10px] font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {cit.scorePercent}%
                </span>
                {loadingFileId === cit.fileId ? (
                  <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Developer Context Engine Inspector */}
      {showInspector && (
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-[#090D16]/95 backdrop-blur-md text-xs font-mono space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-blue-400 border-b border-white/10 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <Cpu className="h-4 w-4 text-blue-400" />
              CONTEXT ENGINE INSPECTOR
            </span>
            <span className="text-[11px] text-slate-400">
              {retrievedChunksCount || citations.length} Chunks Injected • ~{retrievedTokensCount || 0} Tokens Used
            </span>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
              <span className="text-slate-400 text-[10px]">Context Strategy</span>
              <p className="font-bold text-emerald-400 capitalize">{strategyMeta?.strategy || 'Conversation'}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
              <span className="text-slate-400 text-[10px]">Prior Attachments Used</span>
              <p className={`font-bold ${strategyMeta?.previousContextUsed ? 'text-emerald-400' : 'text-slate-400'}`}>
                {strategyMeta?.previousContextUsed ? 'Yes (Expanded Scope)' : 'No (Message Priority)'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
              <span className="text-slate-400 text-[10px]">Chunks Loaded</span>
              <p className="font-bold text-blue-300">
                {strategyMeta ? `${strategyMeta.chunksInjected} / ${strategyMeta.totalChunksAvailable}` : `${citations.length}`}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
              <span className="text-slate-400 text-[10px]">Semantic Search</span>
              <p className={`font-bold ${strategyMeta?.semanticSearchEnabled ? 'text-blue-400' : 'text-slate-400'}`}>
                {strategyMeta?.semanticSearchEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Agent Execution Metadata */}
          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <div>
                <span className="font-semibold text-blue-300">Agent: {strategyMeta?.agentMeta?.agentName || 'General Agent'}</span>
                <p className="text-[10px] text-slate-400 italic">{strategyMeta?.agentMeta?.routingReason || 'Default general-purpose agent.'}</p>
              </div>
            </div>
            {strategyMeta?.agentMeta && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                {(strategyMeta.agentMeta.durationMs / 1000).toFixed(2)}s
              </span>
            )}
          </div>

          {/* Workspace Memories Breakdown */}
          {strategyMeta?.memoriesInjected && strategyMeta.memoriesInjected.length > 0 && (
            <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-purple-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  Active Workspace Memories ({strategyMeta.memoriesInjected.length})
                </span>
                <span className="text-[10px] text-purple-400 font-normal">Context Budget Priority</span>
              </div>
              <div className="space-y-1 pt-0.5">
                {strategyMeta.memoriesInjected.map((m, i) => {
                  const scope = m.scope || 'conversation';
                  const isWorkspace = scope === 'workspace';
                  
                  return (
                    <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-white/5 text-[10px]">
                      <span className="text-slate-200 truncate max-w-[280px]">
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded border mr-1.5 ${
                          isWorkspace 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {isWorkspace ? <Globe className="h-2 w-2" /> : <Brain className="h-2 w-2" />}
                          {isWorkspace ? 'WORKSPACE' : 'CONVERSATION'}
                        </span>
                        <strong className="text-purple-300 uppercase mr-1">[{m.type}]</strong> {m.content}
                      </span>
                      {m.isPinned && (
                        <span className="flex items-center gap-1 text-[9px] text-amber-300 font-bold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/30 shrink-0 ml-1">
                          <Pin className="h-2 w-2" /> Pinned
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scope Reason */}
          {strategyMeta?.previousContextReason && (
            <div className="p-2 rounded-lg bg-slate-900/70 border border-white/5 text-[11px] space-y-0.5">
              <span className="text-slate-400 text-[10px]">Reason for Context Scope:</span>
              <p className="text-blue-300 font-sans italic">{strategyMeta.previousContextReason}</p>
            </div>
          )}

          {/* Files Summary */}
          {strategyMeta?.filesLoaded && strategyMeta.filesLoaded.length > 0 && (
            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5 space-y-1 text-[11px]">
              <span className="text-slate-400 font-semibold">Loaded Target Files:</span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {strategyMeta.filesLoaded.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    {f.filename} ({f.chunkCount} chunks)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chunks Detail Breakdown */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {citations.map((c, i) => (
              <div key={i} className="p-2 rounded bg-slate-900/90 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="text-blue-300 font-semibold">[SOURCE {i + 1}] {c.filename}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Source: {c.sourceOrigin || 'Message Attachment'}
                    </span>
                    <span className="text-emerald-400">Score: {(c.score || 0).toFixed(4)} ({c.scorePercent}%)</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-sans line-clamp-2 italic">
                  "{c.excerpt}"
                </p>
              </div>
            ))}
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
