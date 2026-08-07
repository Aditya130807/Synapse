import { z } from 'zod';
import path from 'node:path';
import { FileSort } from './files.types.js';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'markdown', 'docx']);

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // fallback checked against extension
]);

export const REJECTED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'ps1', 'dll', 'so', 'dylib',
  'zip', 'tar', 'gz', '7z', 'rar',
  'js', 'ts', 'jsx', 'tsx', 'py', 'php', 'rb', 'pl', 'c', 'cpp', 'java'
]);

export function validateFileExtension(filename: string): { isValid: boolean; extension: string; error?: string } {
  const extWithDot = path.extname(filename).toLowerCase();
  const ext = extWithDot.startsWith('.') ? extWithDot.slice(1) : extWithDot;

  if (!ext) {
    return { isValid: false, extension: '', error: 'File must have an extension' };
  }

  if (REJECTED_EXTENSIONS.has(ext)) {
    return { isValid: false, extension: ext, error: `File type .${ext} is restricted` };
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { isValid: false, extension: ext, error: `Only PDF, TXT, Markdown, and DOCX files are allowed` };
  }

  return { isValid: true, extension: ext === 'markdown' ? 'md' : ext };
}

export const listFilesQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.nativeEnum(FileSort).optional().default(FileSort.newest),
});

export const updateFileSchema = z.object({
  filename: z.string().min(1, 'Filename cannot be empty').max(255, 'Filename too long'),
});
