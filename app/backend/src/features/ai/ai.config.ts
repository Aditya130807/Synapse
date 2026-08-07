import type { AIProviderName } from './ai.types.js';

/**
 * Default AI provider and model configurations.
 */
export const DEFAULT_AI_PROVIDER: AIProviderName = 'openrouter';
export const DEFAULT_AI_MODEL = 'openai/gpt-oss-20b:free';

/**
 * Default system prompt for Synapse AI assistant.
 * Can be overridden via SYSTEM_PROMPT in environment variables.
 */
export const DEFAULT_SYSTEM_PROMPT =
  'You are Synapse AI, an intelligent assistant inside the Synapse workspace. Be accurate, helpful, concise, and produce Markdown when appropriate.';

export const AI_CONFIG = {
  defaultProvider: DEFAULT_AI_PROVIDER,
  defaultModel: DEFAULT_AI_MODEL,
  defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
  supportedProviders: [
    'openrouter',
    'gemini',
    'openai',
    'anthropic',
    'groq',
    'ollama',
    'azure_openai',
  ] as const,
} as const;
