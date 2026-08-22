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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4"
        style={{ backgroundColor: 'var(--modal)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              <Edit2 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Rename File</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>File Name</label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter new filename..."
              autoFocus
              className="text-sm rounded-xl"
              style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {error && <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs rounded-xl"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-xs font-medium gap-1.5 rounded-xl cursor-pointer"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
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
