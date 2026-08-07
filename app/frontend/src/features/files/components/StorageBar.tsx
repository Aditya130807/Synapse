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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-[#0F172A]/60 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <HardDrive className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Knowledge Storage</h3>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 font-medium">
              <Files className="h-3 w-3" />
              {totalCount} {totalCount === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Store documents, codebases, and notes for Synapse AI context.
          </p>
        </div>
      </div>

      <div className="sm:w-64 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Storage Used</span>
          <span className="text-slate-200 font-semibold">{formatBytes(totalSizeBytes)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
