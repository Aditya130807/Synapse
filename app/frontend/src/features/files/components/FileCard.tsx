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
        return <FileText className="h-5 w-5 text-rose-400" />;
      case 'md':
      case 'markdown':
        return <FileCode className="h-5 w-5 text-indigo-400" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-5 w-5 text-blue-400" />;
      default:
        return <FileIcon className="h-5 w-5 text-slate-300" />;
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
    <Card className="group relative flex flex-col justify-between p-4 rounded-xl border border-white/[0.08] bg-[#0F172A]/70 hover:bg-[#0F172A] hover:border-white/[0.15] transition-all shadow-sm">
      <div className="space-y-3">
        {/* Header: Icon, badges & options */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
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
                <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${statusProps.dotColor}`} />
              )}
              {statusProps.label}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-[#0F172A] border-white/10 text-slate-200">
                <DropdownMenuItem onClick={() => onPreview(file)} className="gap-2 text-xs cursor-pointer">
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                  <span>Preview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(file)} className="gap-2 text-xs cursor-pointer">
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(file)} className="gap-2 text-xs cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(file)}
                  className="gap-2 text-xs text-rose-400 focus:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File Name & Info */}
        <div className="space-y-1">
          <h4
            className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-blue-400 transition-colors"
            title={file.filename}
            onClick={() => onPreview(file)}
          >
            {file.filename}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{formatRelativeDate(file.createdAt)}</span>
          </div>

          {/* RAG Chunks / Token Metadata Badge */}
          {file.status === 'processed' && file.tokenCount !== null && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <Layers className="h-3 w-3 text-blue-400" />
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

        {/* Referenced Conversations List / Badge */}

        <div className="pt-2 border-t border-white/[0.04]">
          {conversationCount === 0 ? (
            <span className="text-[11px] text-slate-500 italic">Not referenced in any chat</span>
          ) : conversationCount === 1 && firstConv ? (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
              <MessageSquare className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="text-slate-400">Used in</span>
              <button
                type="button"
                onClick={(e) => handleConversationClick(firstConv.id, e)}
                className="font-medium text-blue-400 hover:underline truncate text-left cursor-pointer"
                title={firstConv.title}
              >
                {firstConv.title}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <MessageSquare className="h-3 w-3 text-blue-400 shrink-0" />
                <span>Used in {conversationCount} conversations</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {conversations.slice(0, 2).map((c) => (
                  c.conversation ? (
                    <button
                      key={c.conversation.id}
                      type="button"
                      onClick={(e) => handleConversationClick(c.conversation.id, e)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors truncate max-w-[140px] cursor-pointer"
                    >
                      {c.conversation.title}
                    </button>
                  ) : null
                ))}
                {conversationCount > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-slate-400 font-mono">
                    +{conversationCount - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Quick Action Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview(file)}
          className="flex-1 h-8 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg"
        >
          <Eye className="h-3.5 w-3.5 text-blue-400" />
          <span>Preview</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(file)}
          className="flex-1 h-8 text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          <span>Download</span>
        </Button>
      </div>
    </Card>
  );
}

