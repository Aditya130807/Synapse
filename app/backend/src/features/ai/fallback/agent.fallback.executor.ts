import { providerFactory } from '../factory/providerFactory.js';
import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { AgentModelProfile } from '../model-profiles/agent.model.profiles.js';
import type { ChatMessage, AIResponse } from '../ai.types.js';

export interface FallbackExecutionResult {
  response: AIResponse;
  meta: {
    provider: string;
    requestedModel: string;
    selectedModel: string;
    resolvedModel?: string;
    fallback: boolean;
    fallbackReason?: string;
    fallbackAttempts: number;
  };
}

export interface AgentFallbackOptions {
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
  requiresTools?: boolean;
}

export class AgentFallbackExecutor {
  /**
   * Deterministically attempts the primary model and subsequent fallback models
   * in sequence until one succeeds or maxAttempts is reached.
   *
   * Retries ONLY on temporary provider availability errors:
   * - HTTP 429 (Rate limit)
   * - HTTP 502 / 503 / 504 (Provider / Bad Gateway / Service Unavailable)
   * - Network failure / timeout / unreachable provider
   *
   * Does NOT retry on:
   * - HTTP 400 (Bad Request / Validation)
   * - HTTP 401 / 403 (Auth failure)
   * - Database errors / Application bugs / Tool permission errors
   */
  public async execute(
    messages: ChatMessage[],
    profile: AgentModelProfile,
    options?: AgentFallbackOptions
  ): Promise<FallbackExecutionResult> {
    const candidates = [profile.primary, ...profile.fallbacks];
    const maxTries = Math.min(candidates.length, profile.maxAttempts);

    const requestedModel = profile.primary;
    let lastError: Error | null = null;
    let fallbackReason = '';

    for (let index = 0; index < maxTries; index++) {
      const currentModel = candidates[index];
      const fallbackAttempts = index; // 0 = primary, 1 = 1st fallback, 2 = 2nd fallback

      try {
        const provider = providerFactory({ model: currentModel });
        let aiResponse: AIResponse;

        if (options?.onChunk) {
          aiResponse = await provider.generateStreamResponse(messages, options.onChunk, options.signal);
        } else {
          aiResponse = await provider.generateResponse(messages);
        }

        const isFallback = currentModel !== requestedModel;

        return {
          response: aiResponse,
          meta: {
            provider: env.AI_PROVIDER,
            requestedModel,
            selectedModel: currentModel,
            resolvedModel: aiResponse.resolvedModel || currentModel,
            fallback: isFallback,
            fallbackReason: isFallback ? fallbackReason || `Primary model ${requestedModel} failed.` : undefined,
            fallbackAttempts,
          },
        };
      } catch (err: any) {
        lastError = err;

        // User abort -> throw immediately without fallback retries
        if (options?.signal?.aborted || err?.statusCode === 499) {
          throw err;
        }

        const isRetryable = this.isRetryableError(err);
        if (!isRetryable) {
          // Non-retryable error (e.g. 400, 401, 403, DB error, application bug) -> fail fast
          throw err;
        }

        fallbackReason = `Model "${currentModel}" failed: ${err.message || 'Provider failure'}`;
        console.warn(`[AgentFallbackExecutor] Attempt ${index + 1}/${maxTries} for agent "${profile.agentId}" using model "${currentModel}" failed: ${err.message}`);
      }
    }

    throw lastError || new ApiError(503, `All models exhausted for agent "${profile.agentId}".`);
  }

  private isRetryableError(err: any): boolean {
    if (!err) return false;
    const status = err.statusCode || err.status;
    if (status === 429 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    const msg = String(err.message || '').toLowerCase();
    if (
      msg.includes('rate limit') ||
      msg.includes('unreachable') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('network error') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('fetch failed')
    ) {
      return true;
    }
    return false;
  }
}

export const agentFallbackExecutor = new AgentFallbackExecutor();
