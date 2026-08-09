import type { RAGContext } from './rag.types.js';

export class CitationService {
  /**
   * Formats citation metadata payload for assistant message storage in PostgreSQL
   */
  static prepareMessageMetadata(ragContext: RAGContext, extraMetadata: Record<string, any> = {}) {
    return {
      ...extraMetadata,
      citations: ragContext.citations,
      retrievedChunksCount: ragContext.chunks.length,
      retrievedTokensCount: ragContext.totalTokens,
      hasRAGContext: ragContext.chunks.length > 0,
      strategyMeta: ragContext.strategyMeta,
    };
  }
}
