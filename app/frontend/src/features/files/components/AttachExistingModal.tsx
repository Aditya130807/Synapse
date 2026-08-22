import React, { useState, useEffect } from 'react';
import { Search, FileText, Check, Plus, Loader2, X, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAvailableKnowledgeFilesApi } from '../services/files.api';
import type { AvailableKnowledgeFile } from '../types/files.types';
import { formatBytes, getExtensionBadgeProps } from '../utils/fileHelpers';

interface AttachExistingModalProps {
  conversationId: string | null;
  onClose: () => void;
  onAttach: (fileId: string, filename: string, extension: string) => Promise<boolean>;
}

export const AttachExistingModal: React.FC<AttachExistingModalProps> = ({
  conversationId,
  onClose,
  onAttach,
}) => {
  const [files, setFiles] = useState<AvailableKnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachingId, setAttachingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFiles() {
      try {
        setLoading(true);
        const res = await getAvailableKnowledgeFilesApi(conversationId || undefined);
        if (isMounted) {
          setFiles(res.data);
        }
      } catch (err) {
        console.error('Failed to load available knowledge files:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadFiles();
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAttachClick = async (file: AvailableKnowledgeFile) => {
    setAttachingId(file.id);
    try {
      const success = await onAttach(file.id, file.filename, file.extension);
      if (success) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, isAttached: true } : f))
        );
      }
    } finally {
      setAttachingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--modal)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0" style={{ backgroundColor: 'var(--primary-muted)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
              <Library className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Attach from Knowledge Base</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Select documents to include as context for this chat</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 border-b shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted)' }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Knowledge Base documents..."
              className="pl-9 text-xs rounded-xl h-9"
              style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[260px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading Knowledge Base...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            filteredFiles.map((file) => {
              const extProps = getExtensionBadgeProps(file.extension);
              const isAttached = file.isAttached;
              const isAttaching = attachingId === file.id;

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl border transition-all group"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 truncate min-w-0 pr-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border shrink-0 ${extProps.iconBg}`}>
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={file.filename}>
                          {file.filename}
                        </h4>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${extProps.colorClass}`}>
                          {extProps.label}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        {formatBytes(file.size)} • {file.conversations?.length || 0} chats
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={isAttached || isAttaching}
                    onClick={() => handleAttachClick(file)}
                    className="text-xs gap-1.5 shrink-0 rounded-xl transition-all cursor-pointer"
                    style={
                      isAttached
                        ? {
                            backgroundColor: 'var(--primary-muted)',
                            borderColor: 'var(--primary-border)',
                            color: 'var(--primary)',
                          }
                        : {
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                          }
                    }
                  >
                    {isAttaching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isAttached ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Attached</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Attach</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>No Knowledge Base documents found</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {searchQuery
                  ? `No document matches "${searchQuery}"`
                  : 'Upload files in chat to add them to your Knowledge Base.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl cursor-pointer"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
