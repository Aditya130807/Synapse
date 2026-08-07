export interface EmbeddingResult {
  chunkId: string;
  embeddingId: string;
  vector: number[];
}

export interface BatchEmbeddingResult {
  fileId: string;
  totalChunks: number;
  embeddedChunks: number;
  embeddedAt: Date;
}
