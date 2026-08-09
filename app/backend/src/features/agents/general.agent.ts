import type {
  Agent,
  AgentCapability,
  AgentContext,
  AgentResult,
  AgentExecutionOptions,
  CanHandleResult,
  ChatMessageInput,
} from './agent.types.js';
import { providerFactory } from '../ai/factory/providerFactory.js';
import { CitationService } from '../rag/rag.service.js';

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

    const provider = providerFactory();
    let assistantContent = '';

    if (options?.onChunk) {
      // Streaming mode
      try {
        const streamResult = await provider.generateStreamResponse(
          messages,
          options.onChunk,
          options.signal
        );
        assistantContent = streamResult.content;
      } catch (err) {
        if (options.signal?.aborted && assistantContent.trim()) {
          // Stream was aborted by user but partial response exists
        } else {
          throw err;
        }
      }
    } else {
      // Sync mode
      const aiResponse = await provider.generateResponse(messages);
      assistantContent = aiResponse.content;
    }

    const finalContent = assistantContent.trim() || 'No response generated.';
    const metadata = CitationService.prepareMessageMetadata(context.ragResult.context);
    const citations = metadata?.citations ?? [];

    return {
      agentId: this.id,
      status: 'success',
      content: finalContent,
      citations,
      strategyMeta: context.ragResult.context.strategyMeta,
      durationMs: Date.now() - startTime,
    };
  }
}

export const generalAgent = new GeneralAgent();
