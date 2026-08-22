import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Brain,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Check,
  X,
  Target,
  Settings,
  Scale,
  Loader2,
  Search,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  getPersistentMemoriesApi,
  createPersistentMemoryApi,
  updatePersistentMemoryApi,
  deletePersistentMemoryApi,
} from '../services/memory.api';
import type {
  PersistentMemory,
  PersistentMemoryScope,
  PersistentMemoryType,
  Message,
} from '../chat.types';

interface MemoryPanelProps {
  conversationId?: string | null;
  lastAssistantMessage?: Message | null;
  onClose: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  conversationId,
  lastAssistantMessage,
  onClose,
}) => {
  const [memories, setMemories] = useState<PersistentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'instructions' | 'preferences' | 'project' | 'conversation'>('all');

  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<PersistentMemoryType>('INSTRUCTION');
  const [newScope, setNewScope] = useState<PersistentMemoryScope>('WORKSPACE');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Extract memories used in the last assistant response
  const memoriesUsedInResponse: Array<{ id: string; content: string; type: string; scope: string }> =
    (lastAssistantMessage?.metadata as any)?.memoriesUsed || [];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load memories
  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPersistentMemoriesApi({
        conversationId: conversationId || undefined,
        search: searchQuery.trim() || undefined,
      });
      setMemories(data);
    } catch (err: any) {
      console.error('Failed to load memories:', err);
      setError('Failed to load memory database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [conversationId, searchQuery]);

  // Create Memory
  const handleAddMemory = async () => {
    if (!newContent.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const created = await createPersistentMemoryApi({
        content: newContent.trim(),
        type: newType,
        scope: newScope,
        conversationId: newScope === 'CONVERSATION' ? conversationId || undefined : undefined,
      });
      setMemories((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      setNewContent('');
      setIsAdding(false);
    } catch (err: any) {
      console.error('Failed to create memory:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save memory');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Pin State
  const handleTogglePin = async (memory: PersistentMemory) => {
    try {
      const updated = await updatePersistentMemoryApi(memory.id, {
        isPinned: !memory.isPinned,
      });
      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error('Failed to toggle pin state:', err);
    }
  };

  // Save Edit
  const handleSaveEdit = async (memoryId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await updatePersistentMemoryApi(memoryId, {
        content: editContent.trim(),
      });
      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch (err: any) {
      console.error('Failed to edit memory:', err);
      setError(err?.response?.data?.message || 'Failed to update memory');
    }
  };

  // Delete Memory
  const handleDelete = async (memoryId: string) => {
    try {
      await deletePersistentMemoryApi(memoryId);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  // Filter memories by category tab
  const filteredMemories = memories.filter((mem) => {
    if (activeTab === 'instructions') return mem.type === 'INSTRUCTION' || mem.type === 'CONSTRAINT';
    if (activeTab === 'preferences') return mem.type === 'PREFERENCE';
    if (activeTab === 'project') return mem.type === 'PROJECT_CONTEXT' || mem.type === 'FACT';
    if (activeTab === 'conversation') return mem.scope === 'CONVERSATION';
    return true;
  });

  // Categorize memories into distinct groups for structured presentation
  const workspaceInstructions = filteredMemories.filter(
    (m) => (m.type === 'INSTRUCTION' || m.type === 'CONSTRAINT') && m.scope !== 'CONVERSATION'
  );
  const userPreferences = filteredMemories.filter((m) => m.type === 'PREFERENCE');
  const projectContext = filteredMemories.filter(
    (m) => (m.type === 'PROJECT_CONTEXT' || m.type === 'FACT') && m.scope !== 'CONVERSATION'
  );
  const conversationMemories = filteredMemories.filter((m) => m.scope === 'CONVERSATION');

  const getMemoryBadge = (type: PersistentMemoryType) => {
    switch (type) {
      case 'INSTRUCTION':
      case 'CONSTRAINT':
        return {
          icon: <Target className="h-3 w-3" style={{ color: 'var(--primary)' }} />,
          label: 'Instruction',
        };
      case 'PREFERENCE':
        return {
          icon: <Settings className="h-3 w-3 text-purple-400" />,
          label: 'Preference',
        };
      case 'PROJECT_CONTEXT':
      case 'FACT':
        return {
          icon: <Scale className="h-3 w-3 text-amber-400" />,
          label: 'Project Context',
        };
      case 'SUMMARY':
      default:
        return {
          icon: <Brain className="h-3 w-3 text-indigo-400" />,
          label: 'Fact',
        };
    }
  };

  const renderMemoryCard = (mem: PersistentMemory) => {
    const badge = getMemoryBadge(mem.type);
    const isEditing = editingId === mem.id;

    return (
      <div
        key={mem.id}
        className={`group p-3.5 rounded-2xl border transition-all shadow-2xs ${
          mem.isPinned ? 'ring-1' : ''
        }`}
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: mem.isPinned ? 'var(--primary-border)' : 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            <span
              className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {mem.scope}
            </span>

            {mem.isPinned && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                <Pin className="h-2.5 w-2.5" />
                PINNED
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={() => handleTogglePin(mem)}
              className="p-1 rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: mem.isPinned ? 'var(--primary)' : 'var(--muted)',
              }}
              title={mem.isPinned ? 'Unpin memory' : 'Pin memory'}
            >
              {mem.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </button>

            <button
              onClick={() => {
                setEditingId(mem.id);
                setEditContent(mem.content);
              }}
              className="p-1 rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
              title="Edit memory"
            >
              <Edit2 className="h-3 w-3" />
            </button>

            <button
              onClick={() => handleDelete(mem.id)}
              className="p-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Delete memory"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full border rounded-xl p-2 text-xs focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--primary)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-2 py-0.5 text-[11px]"
                style={{ color: 'var(--muted)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(mem.id)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                <Check className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-relaxed break-words font-sans select-text" style={{ color: 'var(--text-primary)' }}>
            {mem.content}
          </p>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 top-[3.5rem] z-40 flex justify-end bg-black/30 dark:bg-black/40 transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Opaque Right Drawer Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] sm:w-[400px] h-full border-l shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 select-none"
        style={{
          backgroundColor: 'var(--surface)', // 100% OPAQUE SURFACE #111612 (Dark) / #FFFFFF (Light)
          borderColor: 'var(--border)',
        }}
      >
        {/* 1. Header (Fixed) */}
        <div className="flex items-start justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl font-bold shadow-xs border shrink-0 mt-0.5"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              <Brain className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Persistent Memory
                </h2>
                <span
                  className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {memories.length} active
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Instructions & preferences Synapse follows automatically
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors cursor-pointer hover:bg-[var(--surface-elevated)] shrink-0 ml-2"
            style={{ color: 'var(--muted)' }}
            title="Close memory drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Search Bar (Fixed) */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-0.5"
                style={{ color: 'var(--muted)' }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Category Filters (Fixed) */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'instructions', label: 'Instructions' },
              { id: 'preferences', label: 'Preferences' },
              { id: 'project', label: 'Project' },
              { id: 'conversation', label: 'Chat' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium whitespace-nowrap"
                style={
                  activeTab === tab.id
                    ? {
                        backgroundColor: 'var(--primary-muted)',
                        border: '1px solid var(--primary-border)',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }
                    : { color: 'var(--muted)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-4">
          {/* Used For This Response Panel */}
          {memoriesUsedInResponse.length > 0 && (
            <div
              className="p-3 rounded-xl border space-y-1.5"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--primary-border)',
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                <span>Used for latest response ({memoriesUsedInResponse.length})</span>
              </div>
              <div className="space-y-1">
                {memoriesUsedInResponse.map((item) => (
                  <div key={item.id} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>✓</span>
                    <span className="line-clamp-2">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Memory Inline Form */}
          {isAdding && (
            <div
              className="p-3.5 rounded-2xl border space-y-3 animate-in fade-in duration-150"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--primary-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>New Persistent Rule</span>
                <div className="flex items-center gap-1.5">
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as PersistentMemoryScope)}
                    className="border text-[11px] rounded-lg px-2 py-0.5 focus:outline-none"
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="WORKSPACE">Workspace</option>
                    <option value="GLOBAL">Global</option>
                    <option value="CONVERSATION">Conversation</option>
                  </select>

                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PersistentMemoryType)}
                    className="border text-[11px] rounded-lg px-2 py-0.5 focus:outline-none"
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="INSTRUCTION">Instruction</option>
                    <option value="PREFERENCE">Preference</option>
                    <option value="PROJECT_CONTEXT">Project Context</option>
                    <option value="CONSTRAINT">Constraint</option>
                    <option value="FACT">Fact</option>
                  </select>
                </div>
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Always use PostgreSQL and Prisma for this project..."
                rows={2.5}
                className="w-full border rounded-xl p-2.5 text-xs resize-none focus:outline-none"
                style={{
                  backgroundColor: 'var(--input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-xl text-xs font-medium transition-colors"
                  style={{ color: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMemory}
                  disabled={submitting || !newContent.trim()}
                  className="px-3.5 py-1 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Instruction'}
                </button>
              </div>
            </div>
          )}

          {/* Memory List Rendering */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs gap-2" style={{ color: 'var(--muted)' }}>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--primary)' }} />
              <span>Loading persistent memories...</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3" style={{ color: 'var(--muted)' }}>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <Brain className="h-6 w-6 opacity-60" style={{ color: 'var(--primary)' }} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No memories yet</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Synapse can remember project instructions, preferences, and useful context across conversations.
                </p>
              </div>
            </div>
          ) : (
            /* Categorized Memory Lists */
            <div className="space-y-5">
              {workspaceInstructions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--muted)' }}>
                    Workspace Instructions ({workspaceInstructions.length})
                  </h4>
                  <div className="space-y-2.5">{workspaceInstructions.map(renderMemoryCard)}</div>
                </div>
              )}

              {userPreferences.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--muted)' }}>
                    User Preferences ({userPreferences.length})
                  </h4>
                  <div className="space-y-2.5">{userPreferences.map(renderMemoryCard)}</div>
                </div>
              )}

              {projectContext.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--muted)' }}>
                    Project Context ({projectContext.length})
                  </h4>
                  <div className="space-y-2.5">{projectContext.map(renderMemoryCard)}</div>
                </div>
              )}

              {conversationMemories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--muted)' }}>
                    Conversation Context ({conversationMemories.length})
                  </h4>
                  <div className="space-y-2.5">{conversationMemories.map(renderMemoryCard)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Drawer Footer (Fixed at Bottom with EXACTLY ONE Primary Add Memory Action) */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding ? 'Close Form' : '+ Add Memory'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
