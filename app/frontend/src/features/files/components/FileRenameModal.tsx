import { useState, useEffect } from 'react';
import { X, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KnowledgeFile } from '../types/files.types';
import { updateFileApi } from '../services/files.api';

interface FileRenameModalProps {
  file: KnowledgeFile | null;
  onClose: () => void;
  onRenamed: (updatedFile: KnowledgeFile) => void;
}

export function FileRenameModal({ file, onClose, onRenamed }: FileRenameModalProps) {
  const [filename, setFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setFilename(file.filename);
      setError(null);
    }
  }, [file]);

  if (!file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) {
      setError('Filename cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await updateFileApi(file.id, filename.trim());
      onRenamed(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to rename file');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Edit2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Rename File</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">File Name</label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter new filename..."
              autoFocus
              className="bg-slate-900 border-white/10 text-slate-200 text-sm focus:border-blue-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs border-white/10 text-slate-300 hover:bg-white/[0.08]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
