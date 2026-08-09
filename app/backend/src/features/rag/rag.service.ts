import { retrievalService, type RetrievalOptions } from './retrieval.service.js';
import { contextService } from './context.service.js';
import { PromptBuilder } from './promptBuilder.js';
import { CitationService } from './citation.service.js';
import type { RAGPromptResult } from './rag.types.js';

export class RAGService {
  /**
   * Complete RAG pipeline execution for a user prompt inside a conversation
   */
  async prepareRAGPrompt(
    conversationId: string | null,
    userId: string,
    query: string,
    options?: RetrievalOptions
  ): Promise<RAGPromptResult> {
    // 1. Retrieve relevant chunks
    const chunks = await retrievalService.retrieveRelevantChunks(
      conversationId,
      userId,
      query,
      options
    );

    // 2. Build RAG context block
    const ragContext = contextService.buildRAGContext(chunks);

    // 3. Construct system prompt & user prompt
    const { systemPrompt, augmentedUserQuery } = PromptBuilder.buildRAGPrompt(query, ragContext);

    return {
      systemPrompt,
      userPrompt: augmentedUserQuery,
      context: ragContext,
    };
  }
}

export const ragService = new RAGService();
export { CitationService };
