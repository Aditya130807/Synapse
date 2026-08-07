export interface ParsedDocument {
  text: string;
  pageCount?: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentChunk {
  chunkIndex: number;
  page?: number;
  content: string;
  tokenEstimate: number;
}

export interface ProcessedDocumentResult {
  fileId: string;
  status: 'processed' | 'failed';
  pageCount?: number;
  tokenCount: number;
  chunksCount: number;
  error?: string;
}
