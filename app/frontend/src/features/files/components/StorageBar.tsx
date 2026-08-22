import { HardDrive, Files } from 'lucide-react';
import { formatBytes } from '../utils/fileHelpers';

interface StorageBarProps {
  totalCount: number;
  totalSizeBytes: number;
  maxStorageBytes?: number; // default 500MB workspace quota threshold for visual bar
}

export function StorageBar({
  totalCount,
  totalSizeBytes,
  maxStorageBytes = 500 * 1024 * 1024, // 500 MB
}: StorageBarProps) {
  const percentage = Math.min(100, Math.round((totalSizeBytes / maxStorageBytes) * 100));

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border shrink-0"
          style={{
            backgroundColor: 'var(--primary-muted)',
            borderColor: 'var(--primary-border)',
            color: 'var(--primary)',
          }}
        >
          <HardDrive className="h-5 w-5" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Knowledge Storage
            </h3>
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
              style={{
                backgroundColor: 'var(--surface-hover)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <Files className="h-3 w-3" style={{ color: 'var(--muted)' }} />
              {totalCount} {totalCount === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Store documents, codebases, and notes for Synapse AI context.
          </p>
        </div>
      </div>

      <div className="sm:w-64 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium" style={{ color: 'var(--muted)' }}>Storage Used</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatBytes(totalSizeBytes)}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full border"
          style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}
        >
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              backgroundColor: 'var(--primary)',
              width: `${Math.max(4, percentage)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
