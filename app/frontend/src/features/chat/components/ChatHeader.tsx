import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Edit2, Check, X, ShieldCheck, Brain, Code, Compass, FileText } from 'lucide-react';
import { useChat } from '../context/chatContext';
import { MemoryPanel } from './MemoryPanel';
import { WorkspaceMemoryPanel } from './WorkspaceMemoryPanel';
import { getPersistentMemoriesApi } from '../services/memory.api';
import type { Message } from '../chat.types';

export const ChatHeader: React.FC = () => {
  const { selectedConversation, renameConversation, currentMessages } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showWorkspaceMemoryPanel, setShowWorkspaceMemoryPanel] = useState(false);

  const lastAssistantMsg = [...(currentMessages || [])].reverse().find(m => m.role === 'assistant' && (m.metadata?.strategyMeta as any)?.agentMeta);
  const activeAgentMeta = (lastAssistantMsg?.metadata?.strategyMeta as any)?.agentMeta;

  const getAgentBadge = (agentId?: string, agentName?: string, collabMode?: string) => {
    if (collabMode === 'parallel' || collabMode === 'sequential' || agentId === 'multi-agent') {
      return { label: 'Multi-Agent', icon: <Sparkles className="h-2.5 w-2.5 text-[var(--primary)]" /> };
    }
    switch (agentId) {
      case 'coding':
        return { label: agentName || 'Coding Agent', icon: <Code className="h-2.5 w-2.5 text-[var(--primary)]" /> };
      case 'research':
        return { label: agentName || 'Research Agent', icon: <Compass className="h-2.5 w-2.5 text-[var(--primary)]" /> };
      case 'document':
        return { label: agentName || 'Document Agent', icon: <FileText className="h-2.5 w-2.5 text-[var(--primary)]" /> };
      case 'general':
      default:
        return { label: agentName || 'General Agent', icon: <Sparkles className="h-2.5 w-2.5 text-[var(--primary)]" /> };
    }
  };

  const agentBadge = getAgentBadge(activeAgentMeta?.agentId, activeAgentMeta?.agentName, activeAgentMeta?.collaborationMode);

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

  const [activeMemoryCount, setActiveMemoryCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveCount = async () => {
      try {
        const memories = await getPersistentMemoriesApi({
          conversationId: selectedConversation?.id,
        });
        if (isMounted) setActiveMemoryCount(memories.length);
      } catch {
        // Silently ignore fallback count
      }
    };
    fetchActiveCount();
    return () => {
      isMounted = false;
    };
  }, [selectedConversation?.id, currentMessages?.length]);

  return (
    <div
      className="flex h-14 w-full items-center justify-between border-b px-5 select-none shrink-0 shadow-xs backdrop-blur-xl transition-colors duration-200"
      style={{
        backgroundColor: 'var(--chat-header)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: Active Conversation Info with Inline Editing */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 transition-all duration-200"
          style={{
            backgroundColor: 'var(--primary-muted)',
            borderColor: 'var(--primary-border)',
            color: 'var(--primary)',
          }}
        >
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
                className="w-full border rounded-lg px-2 py-0.5 text-xs focus:outline-none"
                style={{
                  backgroundColor: 'var(--input)',
                  borderColor: 'var(--primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleRenameSubmit}
                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                title="Save title"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedConversation) setTitleInput(selectedConversation.title);
                  setIsEditing(false);
                }}
                className="p-1 transition-colors"
                style={{ color: 'var(--muted)' }}
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
              <h2 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {selectedConversation ? selectedConversation.title : 'Synapse Workspace'}
              </h2>
              {selectedConversation && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 transition-all rounded"
                  style={{ color: 'var(--muted)' }}
                  title="Rename title"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--primary)' }}>
              <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--primary)' }} />
              Active Context
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium font-mono border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {agentBadge.icon}
              {agentBadge.label}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" style={{ color: 'var(--muted)' }} />
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Right: Controls (Memory & Active Indicator, Synapse AI) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowMemoryPanel(true)}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          title="Open Context & Persistent Memory"
        >
          <Brain className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
          <span>Memory</span>
          {activeMemoryCount > 0 && (
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              {activeMemoryCount}
            </span>
          )}
        </button>

        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs shadow-2xs select-none"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          title="Synapse AI Core Engine"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--primary)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--primary)' }} />
          </span>
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Synapse AI</span>
        </div>
      </div>

      {showMemoryPanel && (
        <MemoryPanel
          conversationId={selectedConversation?.id}
          lastAssistantMessage={lastAssistantMsg as Message}
          onClose={() => setShowMemoryPanel(false)}
        />
      )}

      {showWorkspaceMemoryPanel && (
        <WorkspaceMemoryPanel onClose={() => setShowWorkspaceMemoryPanel(false)} />
      )}
    </div>
  );
};
