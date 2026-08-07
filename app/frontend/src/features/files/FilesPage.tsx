import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Files, Trash2, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageBar } from './components/StorageBar';
import { FileCard } from './components/FileCard';
import { FilePreviewModal } from './components/FilePreviewModal';
import { FileRenameModal } from './components/FileRenameModal';
import { SearchResultCard } from '../search/components/SearchResultCard';
import { listFilesApi, downloadFileApi, deleteFileApi, getFileApi } from './services/files.api';
import { searchSemanticApi, type SemanticSearchResultItem } from '../search/services/search.api';
import { FileSort, type KnowledgeFile } from './types/files.types';

export default function FilesPage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<FileSort>(FileSort.newest);

  // Semantic Search State
  const [searchMode, setSearchMode] = useState<'filename' | 'semantic'>('semantic');
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResultItem[]>([]);
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);

  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [renameFile, setRenameFile] = useState<KnowledgeFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = async (search = searchQuery, sort = sortOrder) => {
    try {
      setLoading(true);
      const res = await listFilesApi({ search, sort });
      setFiles(res.data);
      setTotalCount(res.meta.totalCount);
      setTotalSizeBytes(res.meta.totalSizeBytes);
    } catch (err) {
      console.error('Failed to load knowledge files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      setSemanticResults([]);
      return;
    }
    try {
      setIsSearchingSemantic(true);
      const res = await searchSemanticApi(query, 12);
      setSemanticResults(res.data.results);
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setIsSearchingSemantic(false);
    }
  };

  useEffect(() => {
    if (searchMode === 'filename') {
      fetchFiles(searchQuery, sortOrder);
    } else {
      if (searchQuery.trim()) {
        const timer = setTimeout(() => handleSemanticSearch(searchQuery), 300);
        return () => clearTimeout(timer);
      } else {
        setSemanticResults([]);
        fetchFiles('', sortOrder);
      }
    }
  }, [sortOrder, searchMode, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchMode === 'filename') {
      fetchFiles(val, sortOrder);
    }
  };

  const handleSearchResultClick = async (result: SemanticSearchResultItem) => {
    try {
      // Fetch full file details including chunks
      const res = await getFileApi(result.fileId);
      if (res?.data) {
        setPreviewFile(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch preview file details:', err);
    }
  };

  const handleDownload = (file: KnowledgeFile) => {
    downloadFileApi(file.id, file.filename);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteFileApi(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setTotalSizeBytes((prev) => Math.max(0, prev - deleteTarget.size));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileRenamed = (updatedFile: KnowledgeFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)));
  };

  const sortLabels = {
    [FileSort.newest]: 'Newest First',
    [FileSort.oldest]: 'Oldest First',
    [FileSort.name]: 'Name (A-Z)',
    [FileSort.size]: 'Size (Largest)',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          Knowledge Base
        </h1>
        <p className="text-sm text-slate-400">
          AI Document Library & Semantic Retrieval Engine. Manage files and search extracted vector chunks.
        </p>
      </div>

      {/* Storage Usage Bar */}
      <StorageBar totalSizeBytes={totalSizeBytes} totalCount={totalCount} />


      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={
                searchMode === 'semantic'
                  ? 'Search by meaning, topics, concepts... (e.g. "Global state in React")'
                  : 'Filter by filename...'
              }
              className="pl-10 pr-4 bg-[#0F172A]/80 border-white/10 text-slate-200 placeholder:text-slate-500 text-xs sm:text-sm rounded-xl focus:border-blue-500 h-10 shadow-sm"
            />
            {isSearchingSemantic && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 animate-spin" />
            )}
          </div>

          {/* Search Mode Toggle */}
          <div className="flex items-center bg-[#0F172A]/80 p-1 rounded-xl border border-white/10 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setSearchMode('semantic')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                searchMode === 'semantic'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              <span className="hidden sm:inline">Semantic</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('filename')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                searchMode === 'filename'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filename</span>
            </button>
          </div>
        </div>

        {/* Sort Order Dropdown */}
        {searchMode === 'filename' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-white/10 bg-[#0F172A]/80 text-slate-300 hover:bg-slate-900 rounded-xl h-10 px-4"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <span>{sortLabels[sortOrder]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#0F172A] border-white/10 text-slate-200">
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortOrder(key as FileSort)}
                  className="text-xs cursor-pointer focus:bg-white/[0.08]"
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Semantic Search Results View */}
      {searchMode === 'semantic' && searchQuery.trim() ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Semantic Relevance Results ({semanticResults.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Query: "{searchQuery}"</span>
          </div>

          {isSearchingSemantic ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-32 rounded-xl bg-slate-900/60 border border-white/[0.06]" />
              ))}
            </div>
          ) : semanticResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semanticResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onClick={handleSearchResultClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#080D1A]/50 space-y-3">
              <Sparkles className="h-8 w-8 text-blue-400/60" />
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-semibold text-slate-200">No semantic matches found</h4>
                <p className="text-xs text-slate-400">
                  Try searching for related concepts, topics, or key ideas in your documents.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Knowledge Base Document Grid */
        <div className="pt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-44 rounded-xl bg-slate-900/60 border border-white/[0.06]" />
              ))}
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={setPreviewFile}
                  onDownload={handleDownload}
                  onRename={setRenameFile}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-white/10 bg-[#080D1A]/50 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Files className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-semibold text-foreground">No documents in Knowledge Base</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload PDF, Markdown, TXT, or DOCX files directly inside AI Chat to automatically extract semantic vector chunks and enable AI context retrieval.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {/* File Rename Modal */}
      <FileRenameModal
        file={renameFile}
        onClose={() => setRenameFile(null)}
        onRenamed={handleFileRenamed}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete Document</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-white font-mono">"{deleteTarget.filename}"</span> and all associated vector chunks from your Knowledge Base?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
