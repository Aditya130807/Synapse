import prisma from '../../lib/prisma.js';
import { vectorProvider } from '../../lib/vector/vector.factory.js';
import { embeddingService } from '../embeddings/embedding.service.js';
import type { SemanticSearchResultItem } from './search.types.js';

export class SemanticSearchService {
  /**
   * Perform semantic similarity search across all Knowledge Base files belonging to a user.
   */
  async searchKnowledgeBase(
    userId: string,
    query: string,
    limit = 10
  ): Promise<SemanticSearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // 1. Generate query vector embedding
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Perform vector search filtered strictly by userId
    const rawResults = await vectorProvider.searchVectors(
      queryVector,
      limit,
      { userId },
      process.env.PINECONE_NAMESPACE || 'synapse'
    );

    // 3. Format result objects
    return rawResults.map((res) => {
      const score = Math.max(0, Math.min(1, res.score));
      return {
        id: res.id,
        chunkId: res.metadata.chunkId,
        fileId: res.metadata.fileId,
        filename: res.metadata.filename,
        page: res.metadata.page ?? null,
        chunkIndex: res.metadata.chunkIndex,
        score,
        scorePercent: Math.round(score * 100),
        content: res.metadata.content,
        tokenEstimate: res.metadata.tokenEstimate,
      };
    });
  }

  /**
   * Perform semantic search strictly restricted to files attached to a specific conversation.
   */
  async searchConversationFiles(
    conversationId: string,
    userId: string,
    query: string,
    limit = 10
  ): Promise<SemanticSearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Verify conversation access for userId
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });

    if (!conv) {
      throw new Error('Conversation not found or access denied');
    }

    // Get attached file IDs
    const attachments = await prisma.conversationKnowledgeFile.findMany({
      where: { conversationId },
      select: { fileId: true },
    });

    if (attachments.length === 0) {
      return [];
    }

    const fileIds = attachments.map((a) => a.fileId);

    // Generate query vector
    const queryVector = await embeddingService.generateEmbedding(query);

    // Vector search filtered by userId AND attached fileIds
    const rawResults = await vectorProvider.searchVectors(
      queryVector,
      limit,
      { userId, fileIds },
      process.env.PINECONE_NAMESPACE || 'synapse'
    );

    return rawResults.map((res) => {
      const score = Math.max(0, Math.min(1, res.score));
      return {
        id: res.id,
        chunkId: res.metadata.chunkId,
        fileId: res.metadata.fileId,
        filename: res.metadata.filename,
        page: res.metadata.page ?? null,
        chunkIndex: res.metadata.chunkIndex,
        score,
        scorePercent: Math.round(score * 100),
        content: res.metadata.content,
        tokenEstimate: res.metadata.tokenEstimate,
      };
    });
  }
}

export const semanticSearchService = new SemanticSearchService();
