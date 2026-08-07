import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import { OpenRouterProvider } from '../providers/OpenRouterProvider.js';
import type { AIProvider } from '../providers/AIProvider.js';
import type { AIProviderName } from '../ai.types.js';

/**
 * providerFactory
 *
 * Reads AI_PROVIDER from the environment and returns the corresponding
 * AIProvider implementation. This is the only place that maps provider
 * names to their concrete classes.
 *
 * To add a new provider:
 *   1. Create `providers/YourProvider.ts` implementing AIProvider.
 *   2. Import it here.
 *   3. Add a case to the switch statement below.
 *   4. No other files need to change.
 *
 * @throws ApiError(500) if the configured provider name is not recognized.
 */
export function providerFactory(): AIProvider {
  const providerName = env.AI_PROVIDER as AIProviderName;

  switch (providerName) {
    case 'openrouter':
      return new OpenRouterProvider();

    // Future providers — uncomment as they are implemented:
    // case 'gemini':
    //   return new GeminiProvider();
    // case 'openai':
    //   return new OpenAIProvider();
    // case 'anthropic':
    //   return new AnthropicProvider();
    // case 'groq':
    //   return new GroqProvider();
    // case 'ollama':
    //   return new OllamaProvider();
    // case 'azure_openai':
    //   return new AzureOpenAIProvider();

    default:
      throw new ApiError(
        500,
        `AI provider "${providerName}" is not implemented. ` +
          `Supported providers: openrouter. ` +
          `Check your AI_PROVIDER environment variable.`,
      );
  }
}
