/**
 * Provider-agnostic shared types for the AI abstraction layer.
 * These types must never reference any provider SDK or endpoint.
 */

/**
 * Internal message format passed between the chat service and any AI provider.
 * Normalizes roles to prevent leaking provider-specific types into business logic.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Normalized response returned by every AI provider.
 * Future fields (tokens, model, latency, finishReason) can be added here without
 * touching any provider implementations.
 */
export interface AIResponse {
  content: string;
  resolvedModel?: string;
}

/**
 * Supported AI provider names.
 * Extend this union when adding a new provider, then register it in providerFactory.ts.
 */
export type AIProviderName =
  | 'omniroute'
  | 'openrouter'
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'ollama'
  | 'azure_openai';
