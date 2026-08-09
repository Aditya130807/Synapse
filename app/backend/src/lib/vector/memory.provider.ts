import type { VectorProvider, VectorRecord, VectorSearchResult, VectorFilter } from './vector.interface.js';

export class MemoryVectorProvider implements VectorProvider {
  name = 'memory';

  // namespace -> (vectorId -> VectorRecord)
  private storage = new Map<string, Map<string, VectorRecord>>();

  private getNamespaceStorage(namespace = 'default'): Map<string, VectorRecord> {
    if (!this.storage.has(namespace)) {
      this.storage.set(namespace, new Map<string, VectorRecord>());
    }
    return this.storage.get(namespace)!;
  }

  async upsertVectors(vectors: VectorRecord[], namespace = 'default'): Promise<void> {
    const store = this.getNamespaceStorage(namespace);
    for (const vec of vectors) {
      store.set(vec.id, vec);
    }
  }

  async deleteVectors(ids: string[], namespace = 'default'): Promise<void> {
    const store = this.getNamespaceStorage(namespace);
    for (const id of ids) {
      store.delete(id);
    }
  }

  async deleteByFileId(fileId: string, namespace = 'default'): Promise<void> {
    // Delete matching fileId vectors across all active namespaces
    for (const store of this.storage.values()) {
      for (const [id, record] of Array.from(store.entries())) {
        if (record.metadata.fileId === fileId) {
          store.delete(id);
        }
      }
    }
  }


  async searchVectors(
    queryVector: number[],
    topK = 5,
    filter?: VectorFilter,
    namespace = 'default'
  ): Promise<VectorSearchResult[]> {
    const store = this.getNamespaceStorage(namespace);
    const results: VectorSearchResult[] = [];

    for (const record of store.values()) {
      // Apply filters if provided
      if (filter) {
        if (filter.userId && record.metadata.userId !== filter.userId) {
          continue;
        }
        if (filter.fileId && record.metadata.fileId !== filter.fileId) {
          continue;
        }
        if (filter.fileIds && Array.isArray(filter.fileIds) && !filter.fileIds.includes(record.metadata.fileId)) {
          continue;
        }
      }

      const score = this.cosineSimilarity(queryVector, record.values);
      results.push({
        id: record.id,
        score,
        metadata: record.metadata,
      });
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  async namespaceExists(namespace: string): Promise<boolean> {
    return this.storage.has(namespace) && this.storage.get(namespace)!.size > 0;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
