import type { ChatMessage, AIResponse } from '../ai.types.js';

/**
 * AIProvider interface — the single contract between the AI service and any
 * AI backend. Business logic must ONLY depend on this interface, never on
 * provider-specific classes (OpenRouter, Gemini, OpenAI, Anthropic, etc.).
 *
 * To add a new provider:
 *   1. Create a new file in providers/ that implements this interface.
 *   2. Register it in factory/providerFactory.ts.
 *   3. No other files need to change.
 */
export interface AIProvider {
  generateResponse(messages: ChatMessage[]): Promise<AIResponse>;
  generateStreamResponse(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<AIResponse>;
}
