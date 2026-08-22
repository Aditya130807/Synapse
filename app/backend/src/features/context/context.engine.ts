import prisma from '../../lib/prisma.js';
import { retrievalService } from '../rag/retrieval.service.js';
import { contextService } from '../rag/context.service.js';
import { PromptBuilder } from '../rag/promptBuilder.js';
import { IntentClassifier } from './intent.classifier.js';
import * as persistentMemoryService from '../memory/persistent-memory.service.js';
import type { ContextStrategyMeta, ContextStrategyType } from './context.strategy.js';
import type { RAGPromptResult, RetrievedChunk } from '../rag/rag.types.js';

export class ContextEngine {
  /**
   * Main orchestrator: classifies intent, executes context prioritization & strategy, and builds RAG prompt.
   *
   * Context Priority Levels:
   * Priority 1 — Current message attachments (exclusive scope)
   * Priority 2 — Prior conversation context (ONLY when user explicitly references it)
   * Priority 0 — No context → Normal AI, no retrieval
   *
   * IMPORTANT: Prior conversation files are NEVER automatically retrieved.
   * They are ONLY used when the user's prompt explicitly references prior context
   * (e.g. "compare with the resume I uploaded earlier").
   */
  async execute(
    conversationId: string | null,
    userId: string,
    query: string,
    messageFileIds: string[] = []
  ): Promise<RAGPromptResult> {
    // 1. Fetch conversation-level file IDs & active persistent memories/instructions
    let conversationFileIds: string[] = [];
    let memoriesInjected: Array<{ id: string; content: string; type: string; isPinned: boolean; scope: string; category: string }> = [];
    let memoriesText = '';

    // Fetch top relevant active persistent memories & instructions (Instructions priority 10 are ranked first)
    const persistentMemories = await persistentMemoryService.getRelevantMemoriesForContext(
      userId,
      'default',
      conversationId,
      query,
      12
    );

    if (persistentMemories.length > 0) {
      memoriesInjected = persistentMemories.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        isPinned: m.isPinned,
        scope: m.scope,
        category: m.category,
      }));

      const instructions = persistentMemories.filter((m) => m.type === 'INSTRUCTION' || m.type === 'CONSTRAINT');
      const otherMemories = persistentMemories.filter((m) => m.type !== 'INSTRUCTION' && m.type !== 'CONSTRAINT');

      let formattedBlocks: string[] = [];
      if (instructions.length > 0) {
        formattedBlocks.push(
          'PERSISTENT INSTRUCTIONS (MANDATORY RULES YOU MUST FOLLOW):\n' +
            instructions
              .map((m) => `- [${m.scope} ${m.type}]: ${m.content}`)
              .join('\n')
        );
      }
      if (otherMemories.length > 0) {
        formattedBlocks.push(
          'RELEVANT PROJECT MEMORY & PREFERENCES:\n' +
            otherMemories
              .map((m) => `- [${m.scope} ${m.type}]: ${m.content}`)
              .join('\n')
        );
      }

      memoriesText = formattedBlocks.join('\n\n');
    }

    if (conversationId) {
      const attachments = await prisma.conversationKnowledgeFile.findMany({
        where: { conversationId },
        select: { fileId: true },
      });
      conversationFileIds = attachments.map((a) => a.fileId);
    }

    // 2. Classify intent & detect explicit prior context reference
    let strategy: ContextStrategyType = IntentClassifier.classify(query, messageFileIds);
    const referencesPriorContext = IntentClassifier.detectPriorContextReference(query);

    // 3. Context Priority Routing
    let targetFileIds: string[] = [];
    let previousContextUsed = false;
    let previousContextReason = '';

    if (messageFileIds.length > 0) {
      // Priority 1: Current message attachments take EXCLUSIVE priority
      targetFileIds = [...messageFileIds];
      previousContextReason = 'Current message attachments take exclusive priority.';

      if (referencesPriorContext && conversationFileIds.length > 0) {
        // Expand scope when user explicitly references prior files
        targetFileIds = Array.from(new Set([...messageFileIds, ...conversationFileIds]));
        previousContextUsed = true;
        previousContextReason = 'Expanded scope: user prompt explicitly references prior conversation context/files.';
      }
    } else if (referencesPriorContext && conversationFileIds.length > 0) {
      // Priority 2: Explicit prior context reference — search conversation files
      targetFileIds = conversationFileIds;
      previousContextUsed = true;
      previousContextReason = 'Prior context retrieval: user prompt explicitly references previously uploaded files.';
    } else {
      // Priority 0: No attachments, no prior context reference → Normal AI, no retrieval
      targetFileIds = [];
      previousContextUsed = false;
      previousContextReason = 'No document context — direct AI generation.';
    }

    // 4. Execute retrieval strategy
    let chunks: RetrievedChunk[] = [];
    let totalChunksAvailable = 0;
    const tokenBudget = 8000;
    let compressionApplied = false;
    let semanticSearchEnabled = false;

    if (messageFileIds.length > 0) {
      // Strategy B / C / D: Attached Document Mode — load all chunks from attached files
      const attachedChunks = await retrievalService.retrieveAttachedDocuments(targetFileIds, userId);
      totalChunksAvailable = attachedChunks.length;

      const totalTokens = attachedChunks.reduce(
        (sum, c) => sum + (c.tokenEstimate || Math.ceil(c.content.length / 4)),
        0
      );

      if (totalTokens > tokenBudget) {
        strategy = 'large-document';
        chunks = retrievalService.retrieveCompressedDocuments(attachedChunks, tokenBudget);
        compressionApplied = true;
      } else {
        chunks = attachedChunks;
      }

      // Hybrid mode: additionally perform semantic search over the same files
      if (strategy === 'hybrid') {
        semanticSearchEnabled = true;
        const kbChunks = await retrievalService.retrieveRelevantChunks(conversationId, userId, query, {
          topK: 4,
          fileIds: targetFileIds,
        });
        const seen = new Set(chunks.map((c) => c.chunkId));
        for (const k of kbChunks) {
          if (!seen.has(k.chunkId)) {
            seen.add(k.chunkId);
            chunks.push(k);
          }
        }
      }
    } else if (targetFileIds.length > 0) {
      // Strategy A with prior context: Semantic search over explicitly requested files
      strategy = 'conversation';
      semanticSearchEnabled = true;
      chunks = await retrievalService.retrieveRelevantChunks(conversationId, userId, query, {
        fileIds: targetFileIds,
      });
      totalChunksAvailable = chunks.length;
    } else {
      // No retrieval — Normal AI generation
      // retrievalService is not called; PromptBuilder will use its fallback system prompt
      strategy = 'conversation';
      semanticSearchEnabled = false;
      chunks = [];
      totalChunksAvailable = 0;
    }

    // 5. Build file diagnostic metadata
    const fileCountMap = new Map<string, { filename: string; count: number }>();
    for (const c of chunks) {
      if (!fileCountMap.has(c.fileId)) {
        fileCountMap.set(c.fileId, { filename: c.filename, count: 0 });
      }
      fileCountMap.get(c.fileId)!.count += 1;
    }

    const filesLoaded = Array.from(fileCountMap.entries()).map(([fileId, val]) => ({
      fileId,
      filename: val.filename,
      chunkCount: val.count,
    }));

    const strategyMeta: ContextStrategyMeta = {
      strategy,
      messageFileIds,
      conversationFileIds,
      totalChunksAvailable,
      chunksInjected: chunks.length,
      tokensBudget: tokenBudget,
      tokensUsed: 0,
      compressionApplied,
      semanticSearchEnabled,
      previousContextUsed,
      previousContextReason,
      filesLoaded,
      memoriesInjectedCount: memoriesInjected.length,
      memoriesInjected,
    };

    // 6. Build RAG context block
    const ragContext = contextService.buildRAGContext(chunks, tokenBudget, strategyMeta);

    // 7. Construct system prompt
    const { systemPrompt, augmentedUserQuery } = PromptBuilder.buildRAGPrompt(query, ragContext, memoriesText);

    console.log(
      `[ContextEngine] Strategy: ${strategy} | MsgFiles: ${messageFileIds.length} | TargetFiles: ${targetFileIds.length} | PriorCtx: ${previousContextUsed} | Memories: ${memoriesInjected.length} | Injected: ${ragContext.chunks.length}/${totalChunksAvailable} chunks`
    );

    return {
      systemPrompt,
      userPrompt: augmentedUserQuery,
      context: ragContext,
    };
  }
}

export const contextEngine = new ContextEngine();
