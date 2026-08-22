import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import { OpenRouterProvider } from '../providers/OpenRouterProvider.js';
import { OmniRouteProvider } from '../providers/OmniRouteProvider.js';
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
export function providerFactory(options?: { model?: string }): AIProvider {
  const providerName = env.AI_PROVIDER as AIProviderName;

  switch (providerName) {
    case 'omniroute':
      return new OmniRouteProvider(options?.model);

    case 'openrouter':
      return new OpenRouterProvider(options?.model);

    default:
      throw new ApiError(
        500,
        `AI provider "${providerName}" is not implemented. ` +
          `Supported providers: omniroute, openrouter. ` +
          `Check your AI_PROVIDER environment variable.`,
      );
  }
}
