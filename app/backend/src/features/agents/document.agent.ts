import type {
  Agent,
  AgentCapability,
  AgentContext,
  AgentResult,
  AgentExecutionOptions,
  CanHandleResult,
  ChatMessageInput,
} from './agent.types.js';
import { getModelProfile } from '../ai/model-profiles/agent.model.profiles.js';
import { agentFallbackExecutor } from '../ai/fallback/agent.fallback.executor.js';
import { CitationService } from '../rag/rag.service.js';
import { DOCUMENT_AGENT_SYSTEM_PROMPT } from './prompts/document.prompt.js';
import { ApiError } from '../../utils/ApiError.js';

export class DocumentAgent implements Agent {
  public readonly id = 'document';
  public readonly name = 'Document Agent';
  public readonly description =
    'Specialized agent for document analysis, summarization, multi-chunk synthesis, and retrieval-augmented document QA.';

  public readonly capabilities: AgentCapability[] = [
    'conversation.read',
    'knowledge.read',
    'memory.read',
    'calculator.execute',
  ];

  public async canHandle(context: AgentContext): Promise<CanHandleResult> {
    const hasAttachments = context.messageFileIds && context.messageFileIds.length > 0;
    const queryLower = context.query.toLowerCase();
    const documentKeywords = [
      'explain this',
      'summarize this',
      'what does this document say',
      'this pdf',
      'this file',
      'this readme',
      'attached document',
      'attached file',
      'in this file',
      'in this document',
      'compare these attached',
      'analyze this document',
    ];

    const asksAboutDocument = documentKeywords.some((kw) => queryLower.includes(kw));

    if (hasAttachments && asksAboutDocument) {
      return {
        canHandle: true,
        confidence: 0.95,
        reason: 'User attached file(s) and explicitly requested document analysis.',
      };
    }

    if (hasAttachments && (queryLower.includes('explain') || queryLower.includes('summarize') || queryLower.includes('what is in'))) {
      return {
        canHandle: true,
        confidence: 0.90,
        reason: 'User attached file(s) and requested explanation of the content.',
      };
    }

    return {
      canHandle: false,
      confidence: 0.1,
      reason: 'No document analysis intent or attached file detected.',
    };
  }

  public async execute(
    context: AgentContext,
    options?: AgentExecutionOptions
  ): Promise<AgentResult> {
    const startTime = Date.now();

    if (!context.ragResult) {
      throw new Error('DocumentAgent execution requires assembled ragResult in AgentContext.');
    }

    const systemPromptWithDirective = `${DOCUMENT_AGENT_SYSTEM_PROMPT}\n\n${context.ragResult.systemPrompt}`;

    const messages: ChatMessageInput[] = [
      { role: 'system', content: systemPromptWithDirective },
      ...context.history,
    ];

    const profile = getModelProfile(this.id);
    const fallbackResult = await agentFallbackExecutor.execute(messages, profile, {
      onChunk: options?.onChunk,
      signal: options?.signal,
    });

    const finalContent = fallbackResult.response.content.trim();
    if (!finalContent) {
      throw new ApiError(502, 'DocumentAgent: provider returned empty content after stream completion.');
    }
    const metadata = CitationService.prepareMessageMetadata(context.ragResult.context);
    const citations = metadata?.citations ?? [];

    return {
      agentId: this.id,
      status: 'success',
      content: finalContent,
      citations,
      strategyMeta: context.ragResult.context.strategyMeta,
      agentMeta: {
        agentId: this.id,
        agentName: this.name,
        routingReason: 'Document retrieval & multi-chunk analysis execution.',
        durationMs: Date.now() - startTime,
        traceSteps: [],
        provider: fallbackResult.meta.provider,
        requestedModel: fallbackResult.meta.requestedModel,
        selectedModel: fallbackResult.meta.selectedModel,
        resolvedModel: fallbackResult.meta.resolvedModel,
        fallback: fallbackResult.meta.fallback,
        fallbackReason: fallbackResult.meta.fallbackReason,
        fallbackAttempts: fallbackResult.meta.fallbackAttempts,
      },
      durationMs: Date.now() - startTime,
    };
  }
}

export const documentAgent = new DocumentAgent();
