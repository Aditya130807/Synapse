export type FileStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export enum FileSort {
  newest = 'newest',
  oldest = 'oldest',
  name = 'name',
  size = 'size',
}

export interface KnowledgeFileConversationRef {
  id: string;
  title: string;
}

export interface KnowledgeChunk {
  id: string;
  fileId: string;
  chunkIndex: number;
  page?: number | null;
  content: string;
  tokenEstimate: number;
  createdAt: string;
}

export interface KnowledgeFile {
  id: string;
  filename: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  status: FileStatus;
  lastAccessedAt: string | null;
  processedAt: string | null;
  tokenCount: number | null;
  pageCount: number | null;
  language: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  conversations?: {
    conversation: KnowledgeFileConversationRef;
  }[];
  chunks?: KnowledgeChunk[];
}

export interface AttachedFile {
  id: string;
  conversationId: string;
  fileId: string;
  attachedAt: string;
  isPinned: boolean;
  file: KnowledgeFile;
}

export interface AvailableKnowledgeFile extends KnowledgeFile {
  isAttached?: boolean;
}

export interface ListFilesParams {
  search?: string;
  sort?: FileSort;
}

export interface ListFilesResponse {
  status: string;
  data: KnowledgeFile[];
  meta: {
    totalCount: number;
    totalSizeBytes: number;
  };
}

export interface UploadFileResponse {
  status: string;
  data: KnowledgeFile;
  file?: KnowledgeFile;
  attached?: boolean;
  duplicate?: boolean;
  isDuplicate?: boolean;
  message?: string;
}

export interface PreviewContentResponse {
  status: string;
  data: {
    file: KnowledgeFile;
    content: string;
    chunks?: KnowledgeChunk[];
  };
}


