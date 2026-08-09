import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { contextEngine } from '../context/context.engine.js';
import { agentRouter } from './agent.router.js';
import { agentRegistry } from './agent.registry.js';
import { createMessage } from '../chat/chat.service.js';
import { CitationService } from '../rag/rag.service.js';
import { extractMemoriesAsync } from '../memory/memory.extractor.js';
import type {
  AgentContext,
  AgentExecutionMeta,
  AgentExecutionTraceStep,
  AgentExecutionOptions,
  ChatMessageInput,
} from './agent.types.js';
import type { MessageDTO } from '../chat/chat.types.js';

export class AgentOrchestrator {
  /**
   * Main entry point for synchronous AI response generation.
   * Coordinates ContextEngine -> AgentRouter -> Agent -> DB Persistence -> Async Memory Extraction.
   */
  public async execute(
    userId: string,
    conversationId: string
  ): Promise<MessageDTO> {
    return this.orchestrate(userId, conversationId);
  }

  /**
   * Main entry point for streaming SSE AI response generation.
   */
  public async executeStream(
    userId: string,
    conversationId: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<MessageDTO> {
    return this.orchestrate(userId, conversationId, { onChunk, signal });
  }

  private async orchestrate(
    userId: string,
    conversationId: string,
    options?: AgentExecutionOptions
  ): Promise<MessageDTO> {
    const orchestratorStartTime = Date.now();
    const traceSteps: AgentExecutionTraceStep[] = [];

    traceSteps.push({
      step: 'request.received',
      timestamp: new Date().toISOString(),
    });

    // 1. Verify conversation ownership & fetch message history
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    const history = await prisma.message.findMany({
      where: { conversationId },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const lastUserMsgRecord = history.slice().reverse().find((m) => m.role === 'user');
    const lastUserMsg = lastUserMsgRecord?.content || '';
    const messageFileIds = (lastUserMsgRecord?.attachments || []).map((a) => a.fileId);

    const historyMessages: ChatMessageInput[] = history.map((m) => ({
      role: m.role as ChatMessageInput['role'],
      content: m.content,
    }));

    // 2. Context Engine Assembly
    const contextStartTime = Date.now();
    const ragResult = await contextEngine.execute(
      conversationId,
      userId,
      lastUserMsg,
      messageFileIds
    );
    traceSteps.push({
      step: 'context.assembled',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - contextStartTime,
    });

    // 3. Build Agent Context
    const agentContext: AgentContext = {
      userId,
      conversationId,
      query: lastUserMsg,
      history: historyMessages,
      messageFileIds,
      ragResult,
    };

    // 4. Agent Router Selection
    const routerStartTime = Date.now();
    const routingDecision = await agentRouter.route(agentContext);
    traceSteps.push({
      step: 'agent.selected',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - routerStartTime,
      details: { agentId: routingDecision.agentId, reason: routingDecision.reason },
    });

    // 5. Agent Lookup from Registry
    const agent = agentRegistry.get(routingDecision.agentId);
    if (!agent) {
      throw new ApiError(500, `Selected agent "${routingDecision.agentId}" is not registered.`);
    }

    // 6. Execute Selected Agent
    const agentExecutionStartTime = Date.now();
    const agentResult = await agent.execute(agentContext, options);
    const agentExecutionDuration = Date.now() - agentExecutionStartTime;

    traceSteps.push({
      step: 'agent.executed',
      timestamp: new Date().toISOString(),
      durationMs: agentExecutionDuration,
    });

    // 7. Prepare Execution Metadata
    const totalDuration = Date.now() - orchestratorStartTime;
    const agentMeta: AgentExecutionMeta = {
      agentId: agent.id,
      agentName: agent.name,
      routingReason: routingDecision.reason,
      durationMs: totalDuration,
      traceSteps,
    };

    const messageMetadata = CitationService.prepareMessageMetadata(ragResult.context);
    if (messageMetadata.strategyMeta) {
      messageMetadata.strategyMeta.agentMeta = agentMeta;
    } else {
      messageMetadata.strategyMeta = {
        strategy: 'conversation',
        messageFileIds,
        conversationFileIds: [],
        totalChunksAvailable: 0,
        chunksInjected: 0,
        tokensBudget: 8000,
        tokensUsed: 0,
        compressionApplied: false,
        semanticSearchEnabled: false,
        previousContextUsed: false,
        previousContextReason: '',
        filesLoaded: [],
        agentMeta,
      };
    }

    // 8. Save Assistant Message in DB
    const assistantContent = agentResult.content.trim() || 'No response generated.';
    const assistantMessage = await createMessage(
      userId,
      conversationId,
      'assistant',
      assistantContent,
      messageMetadata
    );

    // 9. Asynchronous non-blocking memory extraction
    extractMemoriesAsync(userId, conversationId, lastUserMsg, assistantContent).catch(() => {});

    return assistantMessage;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
