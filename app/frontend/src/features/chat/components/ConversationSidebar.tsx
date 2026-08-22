import React, { useState, useMemo } from 'react';
import { Plus, Search, X, MessageSquarePlus, SlidersHorizontal } from 'lucide-react';
import { useChat } from '../context/chatContext';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../chat.types';

export const ConversationSidebar: React.FC = () => {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    createNewConversation,
    renameConversation,
    deleteConversation,
    isLoadingConversations,
  } = useChat();

  const [searchFilter, setSearchFilter] = useState('');

  const trimmedFilter = searchFilter.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(trimmedFilter),
    );
  }, [conversations, trimmedFilter]);

  const groupedConversations = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysAgoStart = todayStart - 6 * 86400000;

    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    for (const conv of filteredConversations) {
      const time = new Date(conv.updatedAt).getTime();
      if (time >= todayStart) {
        today.push(conv);
      } else if (time >= yesterdayStart) {
        yesterday.push(conv);
      } else if (time >= sevenDaysAgoStart) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    }

    return { today, yesterday, last7Days, older };
  }, [filteredConversations]);

  const renderConversationGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div key={title} className="mb-4">
        <div className="px-2 mb-1.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
          {title}
        </div>
        <div className="space-y-1">
          {list.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === selectedConversationId}
              onSelect={() => selectConversation(conv.id)}
              onRename={renameConversation}
              onDelete={deleteConversation}
            />
          ))}
        </div>
      </div>
    );
  };

  const hasAnyConversations = filteredConversations.length > 0;

  return (
    <div className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--sidebar)] backdrop-blur-2xl p-3.5 select-none shrink-0">
      {/* Top Action Row */}
      <div className="mb-3.5 flex items-center gap-2">
        <button
          onClick={() => createNewConversation()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold text-xs px-3.5 py-2.5 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all cursor-pointer active:scale-95"
          title="Conversation options"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Real-time Search Input Filter */}
      <div className="relative mb-3.5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-[var(--input)] border border-[var(--border)] focus:border-[var(--primary)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all duration-200"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--muted)] hover:text-[var(--text-primary)] rounded transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Date-Grouped Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {isLoadingConversations ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-11 rounded-xl bg-[var(--skeleton)] animate-pulse border border-[var(--border-subtle)]"
              />
            ))}
          </div>
        ) : !hasAnyConversations ? (
          <div className="flex flex-col items-center justify-center py-12 px-2 text-center text-[var(--muted)]">
            <MessageSquarePlus className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">No chats found</p>
            <p className="text-[11px] opacity-60 mt-0.5">
              {searchFilter ? 'Try a different search term' : 'Click "+ New Chat" to begin'}
            </p>
          </div>
        ) : (
          <>
            {renderConversationGroup('Today', groupedConversations.today)}
            {renderConversationGroup('Yesterday', groupedConversations.yesterday)}
            {renderConversationGroup('Last 7 Days', groupedConversations.last7Days)}
            {renderConversationGroup('Older', groupedConversations.older)}
          </>
        )}
      </div>
    </div>
  );
};
