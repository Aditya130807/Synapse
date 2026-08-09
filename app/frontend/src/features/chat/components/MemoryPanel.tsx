import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Target,
  Settings,
  Scale,
  FileText,
  Loader2,
} from 'lucide-react';
import { getMemoriesApi, createMemoryApi, updateMemoryApi, deleteMemoryApi } from '../services/memory.api';
import type { ConversationMemory, MemoryType } from '../chat.types';

interface MemoryPanelProps {
  conversationId: string;
  onClose: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ conversationId, onClose }) => {
  const [memories, setMemories] = useState<ConversationMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('fact');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load memories
  useEffect(() => {
    let isMounted = true;
    const fetchMemories = async () => {
      try {
        setLoading(true);
        const data = await getMemoriesApi(conversationId);
        if (isMounted) setMemories(data);
      } catch (err) {
        console.error('Failed to load conversation memories:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMemories();
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Create Memory
  const handleAddMemory = async () => {
    if (!newContent.trim()) return;
    try {
      setSubmitting(true);
      const created = await createMemoryApi(conversationId, newContent.trim(), newType);
      setMemories((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      setNewContent('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create memory:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (memory: ConversationMemory) => {
    try {
      const updated = await updateMemoryApi(conversationId, memory.id, {
        isPinned: !memory.isPinned,
      });
      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error('Failed to toggle memory pin state:', err);
    }
  };

  // Update Content
  const handleSaveEdit = async (memoryId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await updateMemoryApi(conversationId, memoryId, {
        content: editContent.trim(),
      });
      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update memory content:', err);
    }
  };

  // Delete Memory
  const handleDelete = async (memoryId: string) => {
    try {
      await deleteMemoryApi(conversationId, memoryId);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const getMemoryBadge = (type: MemoryType) => {
    switch (type) {
      case 'preference':
        return { icon: <Settings className="h-3 w-3 text-purple-400" />, label: 'Preference', color: 'bg-purple-500/10 border-purple-500/30 text-purple-300' };
      case 'decision':
        return { icon: <Scale className="h-3 w-3 text-amber-400" />, label: 'Decision', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
      case 'goal':
        return { icon: <Target className="h-3 w-3 text-emerald-400" />, label: 'Goal', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' };
      case 'summary':
        return { icon: <FileText className="h-3 w-3 text-blue-400" />, label: 'Summary', color: 'bg-blue-500/10 border-blue-500/30 text-blue-300' };
      case 'fact':
      default:
        return { icon: <Brain className="h-3 w-3 text-indigo-400" />, label: 'Fact', color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0B0F19] border-l border-white/10 shadow-2xl flex flex-col p-5 overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Workspace Memory
                <span className="text-xs font-mono font-normal text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
                  {memories.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Persistent facts & preferences across messages</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Conversation Context
          </span>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Add Memory Inline Form */}
        {isAdding && (
          <div className="mb-4 p-3.5 rounded-2xl border border-indigo-500/40 bg-indigo-950/30 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">New Persistent Memory</span>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as MemoryType)}
                className="bg-slate-900 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="fact">Fact</option>
                <option value="preference">Preference</option>
                <option value="decision">Decision</option>
                <option value="goal">Goal</option>
              </select>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. For this project, PostgreSQL is our database..."
              rows={2}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMemory}
                disabled={submitting || !newContent.trim()}
                className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Memory'}
              </button>
            </div>
          </div>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              <span>Loading workspace memory...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <Brain className="h-8 w-8 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No memories yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                State preferences or facts during chat, or click "Add Memory" to pin key details.
              </p>
            </div>
          ) : (
            memories.map((mem) => {
              const badge = getMemoryBadge(mem.type);
              const isEditing = editingId === mem.id;

              return (
                <div
                  key={mem.id}
                  className={`group p-3 rounded-2xl border transition-all ${
                    mem.isPinned
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'bg-slate-950/60 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {mem.isPinned && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          <Pin className="h-2.5 w-2.5" />
                          PINNED
                        </span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(mem)}
                        className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                          mem.isPinned
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                        }`}
                        title={mem.isPinned ? 'Unpin from prompt' : 'Pin to prompt'}
                      >
                        {mem.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(mem.id);
                          setEditContent(mem.content);
                        }}
                        className="p-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit memory"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="p-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
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
                        className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-2 text-xs text-white focus:outline-none resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(mem.id)}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed break-words font-sans">
                      {mem.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
