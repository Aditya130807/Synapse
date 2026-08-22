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
import { ApiError } from '../../utils/ApiError.js';

export class GeneralAgent implements Agent {
  public readonly id = 'general';
  public readonly name = 'General Agent';
  public readonly description =
    'Default general-purpose AI assistant for conversational interactions, reasoning, and context-augmented queries.';

  public readonly capabilities: AgentCapability[] = [
    'conversation.read',
    'knowledge.read',
    'memory.read',
    'memory.write',
    'calculator.execute',
  ];

  public async canHandle(_context: AgentContext): Promise<CanHandleResult> {
    return {
      canHandle: true,
      confidence: 1.0,
      reason: 'Default general-purpose agent.',
    };
  }

  public async execute(
    context: AgentContext,
    options?: AgentExecutionOptions
  ): Promise<AgentResult> {
    const startTime = Date.now();

    if (!context.ragResult) {
      throw new Error('GeneralAgent execution requires assembled ragResult in AgentContext.');
    }

    const messages: ChatMessageInput[] = [
      { role: 'system', content: context.ragResult.systemPrompt },
      ...context.history,
    ];

    const profile = getModelProfile(this.id);
    const fallbackResult = await agentFallbackExecutor.execute(messages, profile, {
      onChunk: options?.onChunk,
      signal: options?.signal,
    });

    const finalContent = fallbackResult.response.content.trim();
    if (!finalContent) {
      throw new ApiError(502, 'GeneralAgent: provider returned empty content after stream completion.');
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
        routingReason: 'General-purpose conversation execution.',
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

export const generalAgent = new GeneralAgent();
