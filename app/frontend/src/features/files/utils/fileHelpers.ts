import type { FileStatus } from '../types/files.types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatRelativeDate(dateInput: string | Date | null): string {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getExtensionBadgeProps(extension: string) {
  const ext = extension.toLowerCase();
  switch (ext) {
    case 'pdf':
      return {
        label: 'PDF',
        colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    case 'md':
    case 'markdown':
      return {
        label: 'Markdown',
        colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      };
    case 'txt':
      return {
        label: 'TXT',
        colorClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      };
    case 'docx':
    case 'doc':
      return {
        label: 'DOCX',
        colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
    default:
      return {
        label: ext.toUpperCase(),
        colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
  }
}

export function getStatusBadgeProps(status: FileStatus) {
  switch (status) {
    case 'uploaded':
      return {
        label: 'Uploaded',
        colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        dotColor: 'bg-blue-400',
        isProcessing: false,
      };
    case 'processing':
      return {
        label: 'Processing',
        colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotColor: 'bg-amber-400 animate-pulse',
        isProcessing: true,
      };
    case 'processed':
      return {
        label: 'Ready',
        colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotColor: 'bg-emerald-400',
        isProcessing: false,
      };
    case 'failed':
      return {
        label: 'Failed',
        colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dotColor: 'bg-rose-400',
        isProcessing: false,
      };
  }
}

