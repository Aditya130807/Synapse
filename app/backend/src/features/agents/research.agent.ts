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
import { RESEARCH_AGENT_SYSTEM_PROMPT } from './prompts/research.prompt.js';
import { ApiError } from '../../utils/ApiError.js';

export class ResearchAgent implements Agent {
  public readonly id = 'research';
  public readonly name = 'Research Agent';
  public readonly description =
    'Specialized agent for technical research, trade-off comparisons, requirements synthesis, and structured analysis.';

  public readonly capabilities: AgentCapability[] = [
    'conversation.read',
    'knowledge.read',
    'memory.read',
    'web.search',
    'calculator.execute',
  ];

  public async canHandle(context: AgentContext): Promise<CanHandleResult> {
    const queryLower = context.query.toLowerCase();
    const researchKeywords = [
      'compare',
      'pros and cons',
      'tradeoffs',
      'trade-offs',
      'versus',
      ' vs ',
      'evaluate',
      'analyze',
      'what should i use for',
      'differ between',
      'benchmark',
    ];

    const isResearchIntent = researchKeywords.some((kw) => queryLower.includes(kw));

    if (isResearchIntent) {
      return {
        canHandle: true,
        confidence: 0.9,
        reason: 'User prompt indicates technical research, trade-off evaluation, or comparison intent.',
      };
    }

    return {
      canHandle: false,
      confidence: 0.2,
      reason: 'No research intent detected.',
    };
  }

  public async execute(
    context: AgentContext,
    options?: AgentExecutionOptions
  ): Promise<AgentResult> {
    const startTime = Date.now();

    if (!context.ragResult) {
      throw new Error('ResearchAgent execution requires assembled ragResult in AgentContext.');
    }

    const systemPromptWithDirective = `${RESEARCH_AGENT_SYSTEM_PROMPT}\n\n${context.ragResult.systemPrompt}`;

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
      throw new ApiError(502, 'ResearchAgent: provider returned empty content after stream completion.');
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
        routingReason: 'Technical research & comparative analysis execution.',
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

export const researchAgent = new ResearchAgent();
