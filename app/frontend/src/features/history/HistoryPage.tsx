import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  X,
  MessageSquare,
  Trash2,
  Edit2,
  ExternalLink,
  Plus,
  Loader2,
  Calendar,
  Sparkles,
  Paperclip,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { chatService } from '@/features/chat/services/chatService';
import { formatRelativeTime } from '@/utils/time';
import type { Conversation } from '../chat/chat.types';

export default function HistoryPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit / Delete State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async (search = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        setConversations(data.filter((c) => c.title.toLowerCase().includes(query)));
      } else {
        setConversations(data);
      }
    } catch (err: any) {
      console.error('Failed to load conversation history:', err);
      setError('Failed to load conversation history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await chatService.renameConversation(id, editTitle.trim());
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group conversations chronologically
  const groupConversations = (items: Conversation[]) => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    items.forEach((item) => {
      const date = new Date(item.updatedAt || item.createdAt);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 0) today.push(item);
      else if (diffDays === 1) yesterday.push(item);
      else if (diffDays <= 7) last7Days.push(item);
      else older.push(item);
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Last 7 Days', items: last7Days },
      { label: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  };

  const grouped = groupConversations(conversations);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Conversation History
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Search, review, and manage your past AI chat sessions and generated artifacts.
          </p>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversation titles & logs..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
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
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchHistory()} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-40" />
            </Card>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card
          className="border p-12 text-center min-h-[380px] flex items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col items-center justify-center space-y-4 max-w-sm">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <History className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {searchQuery ? 'No matching conversations' : 'No conversation history yet'}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {searchQuery
                  ? 'Try searching with a different title or keyword.'
                  : 'Start a new conversation with Synapse AI to see your saved history here.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate('/chat')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start AI Chat</span>
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{group.label}</span>
                <span className="text-[10px] font-mono opacity-75">({group.items.length})</span>
              </div>

              <div className="grid gap-3">
                {group.items.map((c) => {
                  const isEditing = editingId === c.id;
                  const messageCount = (c as any)._count?.messages ?? (c as any).messages?.length ?? 0;
                  const attachmentCount = (c as any)._count?.attachedFiles ?? (c as any).attachedFiles?.length ?? 0;

                  return (
                    <Card
                      key={c.id}
                      className="group p-4 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 mt-0.5 sm:mt-0"
                          style={{
                            backgroundColor: 'var(--primary-muted)',
                            borderColor: 'var(--primary-border)',
                            color: 'var(--primary)',
                          }}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2 max-w-md">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="border rounded-lg px-2.5 py-1 text-xs focus:outline-none w-full"
                                style={{
                                  backgroundColor: 'var(--input)',
                                  borderColor: 'var(--primary)',
                                  color: 'var(--text-primary)',
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleRename(c.id)}
                                className="p-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded-lg text-[var(--muted)] cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h3
                              onClick={() => navigate(`/chat?id=${c.id}`)}
                              className="text-sm font-semibold truncate cursor-pointer hover:text-[var(--primary)] transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {c.title}
                            </h3>
                          )}

                          <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--muted)' }}>
                            <span>{formatRelativeTime(c.updatedAt || c.createdAt)}</span>
                            <span>•</span>
                            <span>{messageCount} message{messageCount === 1 ? '' : 's'}</span>
                            {attachmentCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" /> {attachmentCount} file{attachmentCount === 1 ? '' : 's'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditTitle(c.title);
                          }}
                          className="p-1.5 rounded-lg border transition-colors cursor-pointer opacity-80 hover:opacity-100"
                          style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                          }}
                          title="Rename title"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTargetId(c.id)}
                          className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => navigate(`/chat?id=${c.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all active:scale-95 cursor-pointer ml-1"
                          style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-xl select-none"
            style={{ backgroundColor: 'var(--modal)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Delete Conversation</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              Are you sure you want to delete this conversation? All associated chat messages and context will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
