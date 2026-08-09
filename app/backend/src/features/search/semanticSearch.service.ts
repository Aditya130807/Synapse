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
    let rawResults = await vectorProvider.searchVectors(
      queryVector,
      limit,
      { userId },
      process.env.PINECONE_NAMESPACE || 'synapse'
    );

    // Database fallback if vector store is empty (e.g. post server restart)
    if (rawResults.length === 0) {
      const dbChunks = await prisma.knowledgeChunk.findMany({
        where: {
          file: { userId },
        },
        include: {
          file: { select: { filename: true, userId: true } },
        },
        take: limit,
      });

      if (dbChunks.length > 0) {
        return dbChunks.map((c, idx) => ({
          id: c.embeddingId || `chunk_${c.id}`,
          chunkId: c.id,
          fileId: c.fileId,
          filename: c.file.filename,
          page: c.page,
          chunkIndex: c.chunkIndex,
          score: Math.max(0.1, 0.5 - idx * 0.01),
          scorePercent: 50,
          content: c.content,
          tokenEstimate: c.tokenEstimate,
        }));
      }
    }

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
   * Perform semantic search strictly restricted to attached file IDs.
   */
  async searchConversationFiles(
    conversationId: string,
    userId: string,
    query: string,
    limit = 10,
    overrideFileIds?: string[],
  ): Promise<SemanticSearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    let fileIds: string[] = [];

    if (overrideFileIds && overrideFileIds.length > 0) {
      fileIds = overrideFileIds;
    } else {
      const attachments = await prisma.conversationKnowledgeFile.findMany({
        where: { conversationId },
        select: { fileId: true },
      });
      fileIds = attachments.map((a) => a.fileId);
    }

    if (fileIds.length === 0) {
      return [];
    }

    // Generate query vector
    const queryVector = await embeddingService.generateEmbedding(query);

    // Vector search filtered by userId AND attached fileIds
    let rawResults = await vectorProvider.searchVectors(
      queryVector,
      limit,
      { userId, fileIds },
      process.env.PINECONE_NAMESPACE || 'synapse'
    );

    // Database fallback if vector memory store is empty or unpopulated
    if (rawResults.length === 0) {
      const dbChunks = await prisma.knowledgeChunk.findMany({
        where: {
          fileId: { in: fileIds },
        },
        include: {
          file: { select: { filename: true, userId: true } },
        },
        take: limit,
      });

      if (dbChunks.length > 0) {
        // Asynchronously re-index file embeddings into vector provider
        for (const fId of fileIds) {
          embeddingService.processFileEmbeddings(fId).catch(() => {});
        }

        return dbChunks.map((c, idx) => ({
          id: c.embeddingId || `chunk_${c.id}`,
          chunkId: c.id,
          fileId: c.fileId,
          filename: c.file.filename,
          page: c.page,
          chunkIndex: c.chunkIndex,
          score: Math.max(0.1, 0.5 - idx * 0.01),
          scorePercent: 50,
          content: c.content,
          tokenEstimate: c.tokenEstimate,
        }));
      }
    }

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
