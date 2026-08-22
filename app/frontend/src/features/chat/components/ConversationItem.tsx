import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, MoreVertical, Edit2, Link, Trash2, Check, X } from 'lucide-react';
import { formatRelativeTime } from '@/utils/time';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Conversation } from '../chat.types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(conversation.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize local input state if prop updates externally
  useEffect(() => {
    setTitleInput(conversation.title);
  }, [conversation.title]);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleRenameSubmit = () => {
    if (titleInput.trim() && titleInput.trim() !== conversation.title) {
      onRename(conversation.id, titleInput.trim());
    } else {
      setTitleInput(conversation.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setTitleInput(conversation.title);
      setIsEditing(false);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const link = `${window.location.origin}/chat/${conversation.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div
        onClick={onSelect}
        onDoubleClick={() => {
          setTitleInput(conversation.title);
          setIsEditing(true);
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 select-none ${
          isActive
            ? 'bg-[var(--nav-active-bg)] text-[var(--text-primary)] border-l-2 border-l-[var(--primary)] border-y border-r border-y-[var(--nav-active-border)] border-r-[var(--nav-active-border)] font-semibold'
            : 'text-[var(--muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--text-primary)]'
            }`}
          />

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1 pr-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameSubmit}
                autoFocus
                className="w-full bg-[var(--input)] border border-[var(--primary)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <button
                onClick={handleRenameSubmit}
                className="p-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                title="Save title"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setTitleInput(conversation.title);
                  setIsEditing(false);
                }}
                className="p-1 text-[var(--muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-[13px] leading-tight text-[var(--text-primary)]">
                {conversation.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[var(--muted)] opacity-70 font-normal">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
                {copiedLink && (
                  <span className="text-[10px] text-[var(--primary)] font-medium">Link copied!</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hover Action Trigger Button & Dropdown Menu */}
        {!isEditing && (
          <div
            className="relative shrink-0"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className={`p-1 rounded-lg transition-all ${
                showMenu || isActive
                  ? 'opacity-100 text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  : 'opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
              title="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-[var(--border)] bg-[var(--dropdown)] p-1.5 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setTitleInput(conversation.title);
                    setIsEditing(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <Link className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Copy Link</span>
                </button>
                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title={conversation.title}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(conversation.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};
