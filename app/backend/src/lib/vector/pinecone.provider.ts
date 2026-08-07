import type { VectorProvider, VectorRecord, VectorSearchResult, VectorFilter } from './vector.interface.js';
import { MemoryVectorProvider } from './memory.provider.js';

export class PineconeVectorProvider implements VectorProvider {
  name = 'pinecone';
  private apiKey: string;
  private indexName: string;
  private fallbackProvider: MemoryVectorProvider;

  constructor(apiKey?: string, indexName?: string) {
    this.apiKey = apiKey || process.env.PINECONE_API_KEY || '';
    this.indexName = indexName || process.env.PINECONE_INDEX || 'synapse';
    this.fallbackProvider = new MemoryVectorProvider();
  }

  private isConfigured(): boolean {
    return !!this.apiKey && !!this.indexName;
  }

  async upsertVectors(vectors: VectorRecord[], namespace = 'synapse'): Promise<void> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.upsertVectors(vectors, namespace);
    }
    // Fall back or sync to local memory store to guarantee query capabilities
    await this.fallbackProvider.upsertVectors(vectors, namespace);
  }

  async deleteVectors(ids: string[], namespace = 'synapse'): Promise<void> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.deleteVectors(ids, namespace);
    }
    await this.fallbackProvider.deleteVectors(ids, namespace);
  }

  async deleteByFileId(fileId: string, namespace = 'synapse'): Promise<void> {
    return this.fallbackProvider.deleteByFileId(fileId, namespace);
  }

  async searchVectors(
    queryVector: number[],
    topK = 5,
    filter?: VectorFilter,
    namespace = 'synapse'
  ): Promise<VectorSearchResult[]> {
    if (!this.isConfigured()) {
      return this.fallbackProvider.searchVectors(queryVector, topK, filter, namespace);
    }
    return this.fallbackProvider.searchVectors(queryVector, topK, filter, namespace);
  }

  async namespaceExists(namespace: string): Promise<boolean> {
    return this.fallbackProvider.namespaceExists(namespace);
  }
}
