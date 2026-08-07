export interface VectorRecord {
  id: string;
  values: number[];
  metadata: {
    chunkId: string;
    fileId: string;
    userId: string;
    filename: string;
    page?: number | null;
    chunkIndex: number;
    content: string;
    tokenEstimate?: number;
    [key: string]: any;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorRecord['metadata'];
}

export interface VectorFilter {
  userId?: string;
  fileId?: string;
  fileIds?: string[];
  [key: string]: any;
}

export interface VectorProvider {
  name: string;
  upsertVectors(vectors: VectorRecord[], namespace?: string): Promise<void>;
  deleteVectors(ids: string[], namespace?: string): Promise<void>;
  deleteByFileId(fileId: string, namespace?: string): Promise<void>;
  searchVectors(queryVector: number[], topK: number, filter?: VectorFilter, namespace?: string): Promise<VectorSearchResult[]>;
  namespaceExists(namespace: string): Promise<boolean>;
}
