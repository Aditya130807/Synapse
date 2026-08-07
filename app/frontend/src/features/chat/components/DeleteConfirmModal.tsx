import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F17] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Warning Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-inner">
            <Trash2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Conversation?</h3>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        {/* Message Content */}
        <div className="my-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-white">"{title}"</span>? All messages in this chat will be permanently removed.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:bg-rose-500 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
