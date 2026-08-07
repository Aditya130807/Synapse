import type { KnowledgeFile, FileStatus } from '@prisma/client';

export enum FileSort {
  newest = 'newest',
  oldest = 'oldest',
  name = 'name',
  size = 'size',
}

export interface ListFilesQuery {
  search?: string;
  sort?: FileSort;
}

export interface KnowledgeFileResponse {
  id: string;
  filename: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  status: FileStatus;
  lastAccessedAt: Date | null;
  processedAt: Date | null;
  tokenCount: number | null;
  pageCount: number | null;
  language: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateFilePayload {
  filename?: string;
}

export interface KnowledgeFileConversationRef {
  id: string;
  title: string;
}

export interface AttachedFileResponse {
  id: string;
  conversationId: string;
  fileId: string;
  attachedAt: Date;
  isPinned: boolean;
  file: KnowledgeFileResponse;
}

export interface KnowledgeFileWithConversations extends KnowledgeFileResponse {
  conversations?: {
    conversation: KnowledgeFileConversationRef;
  }[];
}

export interface AvailableKnowledgeFile extends KnowledgeFileResponse {
  isAttached?: boolean;
}

export interface UploadFileResult {
  file: KnowledgeFileWithConversations;
  isDuplicate: boolean;
  attached?: boolean;
  message?: string;
}


