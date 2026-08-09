import prisma from '../../lib/prisma.js';
import { semanticSearchService } from '../search/semanticSearch.service.js';
import type { RetrievedChunk } from './rag.types.js';

export interface RetrievalOptions {
  topK?: number;
  minScoreThreshold?: number;
  fileIds?: string[];
}

export class RetrievalService {
  /**
   * Retrieve ALL chunks belonging to explicitly attached files (Strategy B: Attached Document Mode).
   * Bypasses vector search; loads full document sequentially.
   */
  async retrieveAttachedDocuments(fileIds: string[], userId: string): Promise<RetrievedChunk[]> {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    const dbChunks = await prisma.knowledgeChunk.findMany({
      where: {
        fileId: { in: fileIds },
        file: { userId },
      },
      include: {
        file: { select: { filename: true } },
      },
      orderBy: [
        { fileId: 'asc' },
        { chunkIndex: 'asc' },
      ],
    });

    return dbChunks.map((c) => ({
      id: c.embeddingId || `chunk_${c.id}`,
      chunkId: c.id,
      fileId: c.fileId,
      filename: c.file.filename,
      page: c.page,
      chunkIndex: c.chunkIndex,
      score: 1.0,
      scorePercent: 100,
      content: c.content,
      tokenEstimate: c.tokenEstimate || Math.ceil(c.content.length / 4),
      sourceOrigin: 'Message Attachment' as const,
    }));
  }

  /**
   * Performs hierarchical compression on chunks when total token count exceeds context budget (Strategy C).
   * Retains document structure (intro, key body points, conclusion).
   */
  retrieveCompressedDocuments(chunks: RetrievedChunk[], tokenBudget: number): RetrievedChunk[] {
    if (!chunks || chunks.length === 0) return [];

    // Group chunks by fileId
    const fileGroups = new Map<string, RetrievedChunk[]>();
    for (const chunk of chunks) {
      if (!fileGroups.has(chunk.fileId)) {
        fileGroups.set(chunk.fileId, []);
      }
      fileGroups.get(chunk.fileId)!.push(chunk);
    }

    const compressed: RetrievedChunk[] = [];
    let currentTokens = 0;

    for (const [_, groupChunks] of fileGroups) {
      const totalInGroup = groupChunks.length;
      if (totalInGroup <= 8) {
        // Short group: include all if within budget
        for (const c of groupChunks) {
          const tok = c.tokenEstimate || Math.ceil(c.content.length / 4);
          if (currentTokens + tok <= tokenBudget) {
            compressed.push(c);
            currentTokens += tok;
          }
        }
        continue;
      }

      // Hierarchical sampling: first 3 chunks (intro), every 5th chunk (body), last 2 chunks (conclusion)
      const selectedIndices = new Set<number>();
      selectedIndices.add(0);
      selectedIndices.add(1);
      selectedIndices.add(2);

      for (let i = 3; i < totalInGroup - 2; i += 5) {
        selectedIndices.add(i);
      }

      selectedIndices.add(totalInGroup - 2);
      selectedIndices.add(totalInGroup - 1);

      const sampled = groupChunks.filter((_, idx) => selectedIndices.has(idx));

      for (const c of sampled) {
        const tok = c.tokenEstimate || Math.ceil(c.content.length / 4);
        if (currentTokens + tok <= tokenBudget) {
          compressed.push({
            ...c,
            content: `[COMPRESSED SECTION - Chunk #${c.chunkIndex + 1}]\n${c.content}`,
          });
          currentTokens += tok;
        }
      }
    }

    console.log(
      `[RAG Compression] Original ${chunks.length} chunks reduced to ${compressed.length} chunks (${currentTokens}/${tokenBudget} tokens)`
    );

    return compressed;
  }

  /**
   * Retrieve highest-quality relevant knowledge chunks using semantic search.
   *
   * IMPORTANT: This function respects the caller's file scope exclusively.
   * It does NOT fetch or add conversation files internally. The caller (ContextEngine)
   * is responsible for passing the correct targetFileIds.
   *
   * If fileIds is empty, returns empty immediately (caller decides whether to skip retrieval).
   */
  async retrieveRelevantChunks(
    _conversationId: string | null,  // kept for API compatibility; not used for scope
    userId: string,
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const { topK = 8, minScoreThreshold = 0.01, fileIds: targetFileIds = [] } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // If no file IDs specified, return empty — caller handles the no-retrieval case
    if (targetFileIds.length === 0) {
      return [];
    }

    // Search strictly within the provided file IDs
    let results: RetrievedChunk[] = await semanticSearchService.searchConversationFiles(
      _conversationId || 'temp',
      userId,
      query,
      topK,
      targetFileIds
    );

    // Tag all results as Conversation Context (they come from prior files, not current attachment)
    results = results.map((r) => ({
      ...r,
      sourceOrigin: 'Conversation Context' as const,
    }));

    // Filter by relevance score threshold
    const filtered = results.filter((r) => r.score >= minScoreThreshold);
    const candidateChunks = filtered.length > 0 ? filtered : results;

    // Deduplicate
    const seen = new Set<string>();
    const uniqueChunks: RetrievedChunk[] = [];

    for (const chunk of candidateChunks) {
      if (!seen.has(chunk.chunkId)) {
        seen.add(chunk.chunkId);
        uniqueChunks.push(chunk);
      }
    }

    console.log(
      `[RAG Retrieval] Query: "${query}" | Retained ${uniqueChunks.length} chunk(s) from ${
        new Set(uniqueChunks.map((c) => c.filename)).size
      } file(s) [Target Files: ${targetFileIds.length}]`
    );

    return uniqueChunks.slice(0, topK);
  }
}

export const retrievalService = new RetrievalService();
