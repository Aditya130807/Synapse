import type { RetrievedChunk, RAGContext, Citation } from './rag.types.js';
import type { ContextStrategyMeta } from '../context/context.strategy.js';

export class ContextService {
  /**
   * Formats retrieved chunks into a structured Markdown block and generates citations.
   */
  buildRAGContext(
    chunks: RetrievedChunk[],
    maxTokenBudget = 8000,
    strategyMeta?: ContextStrategyMeta
  ): RAGContext {
    if (!chunks || chunks.length === 0) {
      return {
        chunks: [],
        formattedContextText: '',
        totalTokens: 0,
        citations: [],
        strategyMeta,
      };
    }

    let accumulatedTokens = 0;
    const selectedChunks: RetrievedChunk[] = [];
    const citations: Citation[] = [];
    const contextLines: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTokens = chunk.tokenEstimate || Math.ceil(chunk.content.length / 4);

      if (accumulatedTokens + chunkTokens > maxTokenBudget && selectedChunks.length > 0) {
        break;
      }

      accumulatedTokens += chunkTokens;
      selectedChunks.push(chunk);

      const sourceIndex = selectedChunks.length;
      const pageInfo = chunk.page ? ` (Page ${chunk.page})` : '';

      contextLines.push(
        `--- BEGIN SOURCE [${sourceIndex}]: ${chunk.filename}${pageInfo} ---`
      );
      contextLines.push(chunk.content);
      contextLines.push(`--- END SOURCE [${sourceIndex}] ---\n`);

      citations.push({
        fileId: chunk.fileId,
        filename: chunk.filename,
        page: chunk.page ?? null,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
        scorePercent: chunk.scorePercent,
        excerpt: chunk.content.length > 200 ? `${chunk.content.slice(0, 197)}...` : chunk.content,
        sourceOrigin: chunk.sourceOrigin,
      });
    }

    const formattedContextText = contextLines.join('\n');

    return {
      chunks: selectedChunks,
      formattedContextText,
      totalTokens: accumulatedTokens,
      citations,
      strategyMeta: strategyMeta ? { ...strategyMeta, tokensUsed: accumulatedTokens } : undefined,
    };
  }
}

export const contextService = new ContextService();
