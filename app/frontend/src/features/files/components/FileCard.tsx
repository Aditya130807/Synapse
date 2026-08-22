import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Eye,
  Download,
  Edit2,
  Trash2,
  MoreVertical,
  MessageSquare,
  Loader2,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { KnowledgeFile } from '../types/files.types';
import { formatBytes, formatRelativeDate, getExtensionBadgeProps, getStatusBadgeProps } from '../utils/fileHelpers';

interface FileCardProps {
  file: KnowledgeFile;
  onPreview: (file: KnowledgeFile) => void;
  onDownload: (file: KnowledgeFile) => void;
  onRename: (file: KnowledgeFile) => void;
  onDelete: (file: KnowledgeFile) => void;
}

export function FileCard({ file, onPreview, onDownload, onRename, onDelete }: FileCardProps) {
  const navigate = useNavigate();

  const extProps = getExtensionBadgeProps(file.extension);
  const statusProps = getStatusBadgeProps(file.status);

  const getIcon = () => {
    switch (file.extension.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />;
      default:
        return <FileIcon className="h-4.5 w-4.5 text-neutral-500 dark:text-neutral-400" />;
    }
  };

  const conversations = file.conversations || [];
  const conversationCount = conversations.length;
  const firstConv = conversations[0]?.conversation;
  const chunksCount = file.chunks?.length ?? (file.tokenCount ? Math.max(1, Math.ceil((file.tokenCount || 0) / 200)) : 0);

  const handleConversationClick = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat?id=${convId}`);
  };

  return (
    <Card
      className="group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 shadow-xs"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-3">
        {/* Header: Icon, badges & options */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${extProps.iconBg}`}>
              {getIcon()}
            </div>
            <div>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${extProps.colorClass}`}>
                {extProps.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusProps.colorClass}`}
            >
              {file.status === 'processing' ? (
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${statusProps.dotColor}`} />
              )}
              {statusProps.label}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 border shadow-lg"
                style={{ backgroundColor: 'var(--dropdown)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <DropdownMenuItem onClick={() => onPreview(file)} className="gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  <Eye className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                  <span>Preview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(file)} className="gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  <Download className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(file)} className="gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  <Edit2 className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(file)}
                  className="gap-2 text-xs text-rose-500 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File Name & Metadata Hierarchy */}
        <div className="space-y-1">
          <h4
            className="text-sm font-semibold tracking-tight truncate cursor-pointer transition-colors"
            style={{ color: 'var(--text-primary)' }}
            title={file.filename}
            onClick={() => onPreview(file)}
          >
            {file.filename}
          </h4>

          {/* Size & Relative Time */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{formatRelativeDate(file.createdAt)}</span>
          </div>

          {/* RAG Chunks / Tokens / Pages */}
          {file.status === 'processed' && file.tokenCount !== null && (
            <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" style={{ color: 'var(--muted)' }} />
                {chunksCount} {chunksCount === 1 ? 'chunk' : 'chunks'}
              </span>
              <span>•</span>
              <span>{file.tokenCount} tokens</span>
              {file.pageCount && file.pageCount > 1 && (
                <>
                  <span>•</span>
                  <span>{file.pageCount} pages</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Referenced Conversations ("Used in") Section */}
        <div className="pt-2.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {conversationCount === 0 ? (
            <span className="text-[11px] italic" style={{ color: 'var(--muted)' }}>Not referenced in any chat</span>
          ) : conversationCount === 1 && firstConv ? (
            <div className="flex items-center gap-1.5 text-[11px] truncate">
              <MessageSquare className="h-3 w-3 shrink-0" style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--muted)' }}>Used in</span>
              <button
                type="button"
                onClick={(e) => handleConversationClick(firstConv.id, e)}
                className="font-medium hover:underline truncate text-left cursor-pointer"
                style={{ color: 'var(--primary)' }}
                title={firstConv.title}
              >
                {firstConv.title}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <MessageSquare className="h-3 w-3 shrink-0" style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--muted)' }}>Used in</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{conversationCount} conversations</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {conversations.slice(0, 2).map((c) => (
                  c.conversation ? (
                    <button
                      key={c.conversation.id}
                      type="button"
                      onClick={(e) => handleConversationClick(c.conversation.id, e)}
                      className="text-[10px] px-2 py-0.5 rounded-full border transition-colors truncate max-w-[140px] cursor-pointer"
                      style={{
                        backgroundColor: 'var(--primary-muted)',
                        borderColor: 'var(--primary-border)',
                        color: 'var(--primary)',
                      }}
                    >
                      {c.conversation.title}
                    </button>
                  ) : null
                ))}
                {conversationCount > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 font-mono" style={{ color: 'var(--muted)' }}>
                    +{conversationCount - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Quick Actions Footer */}
      <div className="mt-4 pt-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview(file)}
          className="flex-1 h-8 text-xs gap-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Eye className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
          <span>Preview</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(file)}
          className="flex-1 h-8 text-xs gap-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Download className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
          <span>Download</span>
        </Button>
      </div>
    </Card>
  );
}

