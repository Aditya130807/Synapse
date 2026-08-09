import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Edit2, Check, X, ShieldCheck, Brain } from 'lucide-react';
import { useChat } from '../context/chatContext';
import { MemoryPanel } from './MemoryPanel';
import { WorkspaceMemoryPanel } from './WorkspaceMemoryPanel';
import { Globe } from 'lucide-react';

export const ChatHeader: React.FC = () => {
  const { selectedConversation, renameConversation } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showWorkspaceMemoryPanel, setShowWorkspaceMemoryPanel] = useState(false);

  useEffect(() => {
    if (selectedConversation) {
      setTitleInput(selectedConversation.title);
    }
  }, [selectedConversation?.title]);

  const handleRenameSubmit = () => {
    if (
      selectedConversation &&
      titleInput.trim() &&
      titleInput.trim() !== selectedConversation.title
    ) {
      renameConversation(selectedConversation.id, titleInput.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      if (selectedConversation) setTitleInput(selectedConversation.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex h-14 w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(15,23,42,0.75)] backdrop-blur-xl px-5 select-none shrink-0 shadow-sm">
      {/* Left: Active Conversation Info with Inline Editing */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-[#3B82F6] border border-[#3B82F6]/30 shadow-[0_0_12px_rgba(59,130,246,0.2)] shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          {isEditing && selectedConversation ? (
            <div className="flex items-center gap-1.5 max-w-sm">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameSubmit}
                autoFocus
                className="w-full bg-[#020617] border border-[#3B82F6]/60 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
              <button
                onClick={handleRenameSubmit}
                className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Save title"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedConversation) setTitleInput(selectedConversation.title);
                  setIsEditing(false);
                }}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer max-w-md"
              onDoubleClick={() => selectedConversation && setIsEditing(true)}
            >
              <h2 className="text-sm font-semibold tracking-tight text-[#F8FAFC] truncate">
                {selectedConversation ? selectedConversation.title : 'Synapse Workspace'}
              </h2>
              {selectedConversation && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-400 transition-all rounded"
                  title="Rename title"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Active Context
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-medium font-mono">
              <Sparkles className="h-2.5 w-2.5 text-blue-400" />
              General Agent
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3 w-3 text-blue-400" />
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Right: Memory Button & OpenRouter Model Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowWorkspaceMemoryPanel(true)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 px-3 py-1.5 text-xs text-emerald-200 shadow-sm transition-all active:scale-95 cursor-pointer font-medium"
          title="Open Workspace Memory (persistent across conversations)"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <span>Workspace</span>
        </button>

        {selectedConversation && (
          <button
            onClick={() => setShowMemoryPanel(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 px-3 py-1.5 text-xs text-indigo-200 shadow-sm transition-all active:scale-95 cursor-pointer font-medium"
            title="Open Workspace Memory & Context Control"
          >
            <Brain className="h-3.5 w-3.5 text-indigo-400" />
            <span>Memory</span>
          </button>
        )}

        <div
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-[#020617]/80 px-3 py-1.5 text-xs text-[#CBD5E1] shadow-inner select-none"
          title="Active Model: OpenRouter (openai/gpt-oss-20b:free)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-white">OpenRouter</span>
          <span className="text-[10px] text-blue-400 font-mono font-normal">GPT-OSS 20B</span>
        </div>
      </div>

      {showMemoryPanel && selectedConversation && (
        <MemoryPanel
          conversationId={selectedConversation.id}
          onClose={() => setShowMemoryPanel(false)}
        />
      )}

      {showWorkspaceMemoryPanel && (
        <WorkspaceMemoryPanel onClose={() => setShowWorkspaceMemoryPanel(false)} />
      )}
    </div>
  );
};
