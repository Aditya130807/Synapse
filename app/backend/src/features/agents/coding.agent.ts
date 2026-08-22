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
import { CODING_AGENT_SYSTEM_PROMPT } from './prompts/coding.prompt.js';
import { ApiError } from '../../utils/ApiError.js';

export class CodingAgent implements Agent {
  public readonly id = 'coding';
  public readonly name = 'Coding Agent';
  public readonly description =
    'Specialized agent for software engineering, debugging, code review, architecture, and refactoring.';

  public readonly capabilities: AgentCapability[] = [
    'conversation.read',
    'knowledge.read',
    'memory.read',
    'calculator.execute',
  ];

  public async canHandle(context: AgentContext): Promise<CanHandleResult> {
    const queryLower = context.query.toLowerCase();
    const codingKeywords = [
      'bug',
      'error',
      'exception',
      'stack trace',
      'typescript',
      'javascript',
      'react',
      'node',
      'express',
      'refactor',
      'debug',
      'component',
      'rerender',
      'function',
      'class',
      'interface',
      'api design',
      'schema',
      'sql',
      'syntax',
      'algorithm',
    ];

    const isCodingIntent = codingKeywords.some((kw) => queryLower.includes(kw));

    if (isCodingIntent) {
      return {
        canHandle: true,
        confidence: 0.9,
        reason: 'User prompt indicates software engineering or code analysis intent.',
      };
    }

    return {
      canHandle: false,
      confidence: 0.2,
      reason: 'No software engineering intent detected.',
    };
  }

  public async execute(
    context: AgentContext,
    options?: AgentExecutionOptions
  ): Promise<AgentResult> {
    const startTime = Date.now();

    if (!context.ragResult) {
      throw new Error('CodingAgent execution requires assembled ragResult in AgentContext.');
    }

    const systemPromptWithDirective = `${CODING_AGENT_SYSTEM_PROMPT}\n\n${context.ragResult.systemPrompt}`;

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
      throw new ApiError(502, 'CodingAgent: provider returned empty content after stream completion.');
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
        routingReason: 'Software engineering & code analysis execution.',
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

export const codingAgent = new CodingAgent();
