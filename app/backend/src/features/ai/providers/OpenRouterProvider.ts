import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { AIProvider } from './AIProvider.js';
import type { ChatMessage, AIResponse } from '../ai.types.js';

/** OpenRouter Chat Completions endpoint (OpenAI-compatible). */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * OpenRouterProvider — implements AIProvider using the OpenRouter REST API.
 *
 * OpenRouter exposes an OpenAI-compatible Chat Completions endpoint that
 * routes requests to 100+ models (GPT-4o, Claude, Gemini, Mistral, etc.)
 * under a single API key.
 *
 * This file is the ONLY place allowed to know:
 *   - The OpenRouter endpoint URL
 *   - Authorization header format
 *   - Request/response shape
 *   - Model IDs
 *
 * All other files depend only on the AIProvider interface.
 */
export class OpenRouterProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(modelOverride?: string) {
    if (!env.OPENROUTER_API_KEY) {
      throw new ApiError(
        503,
        'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your environment.',
      );
    }

    this.apiKey = env.OPENROUTER_API_KEY;
    this.model = modelOverride || env.OPENROUTER_MODEL;
  }

  /**
   * Sends a synchronous Chat Completions request to OpenRouter and returns
   * a normalized AIResponse.
   */
  async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
    let response: Response;

    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://synapse-app.dev',
          'X-Title': 'Synapse',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
        }),
      });
    } catch (networkError: unknown) {
      const msg = networkError instanceof Error ? networkError.message : 'Network error';
      throw new ApiError(502, `OpenRouter provider unreachable: ${msg}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ApiError(502, `OpenRouter returned a non-JSON response (HTTP ${response.status})`);
    }

    if (!response.ok) {
      throw this.mapHttpError(response.status, body);
    }

    const text = this.extractContent(body);
    if (!text) {
      throw new ApiError(502, 'OpenRouter returned an empty response.');
    }

    return { content: text };
  }

  /**
   * Sends a streaming Chat Completions request to OpenRouter (`stream: true`)
   * and invokes `onChunk` for each received token.
   */
  async generateStreamResponse(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<AIResponse> {
    let response: Response;

    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://synapse-app.dev',
          'X-Title': 'Synapse',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
        }),
        signal,
      });
    } catch (networkError: unknown) {
      if (signal?.aborted) {
        throw new ApiError(499, 'Request cancelled by user.');
      }
      const msg = networkError instanceof Error ? networkError.message : 'Network error';
      throw new ApiError(502, `OpenRouter provider unreachable: ${msg}`);
    }

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ApiError(502, `OpenRouter returned a non-JSON response (HTTP ${response.status})`);
      }
      throw this.mapHttpError(response.status, body);
    }

    if (!response.body) {
      throw new ApiError(502, 'OpenRouter stream response body is unreadable.');
    }

    // fullContent accumulates ONLY delta.content — the model's actual answer.
    // reasoning_content (present on some models) is intentionally excluded.
    let fullContent = '';
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let streamDone = false;

    try {
      outer: while (true) {
        if (signal?.aborted) {
          await reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Preserve incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              streamDone = true;
              break outer; // Exit both the for-loop and the while-loop
            }

            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed?.choices?.[0]?.delta?.content;
              if (chunk) {
                fullContent += chunk;
                onChunk(chunk);
              }
            } catch {
              // Ignore malformed intermediate chunk JSON
            }
          }
        }
      }
    } catch (err: unknown) {
      if (signal?.aborted) {
        throw new ApiError(499, 'Request cancelled by user.');
      }
      throw err;
    }

    // If the stream completed normally but produced no content, treat it as a
    // provider failure so the fallback executor can try the next model.
    if (!signal?.aborted && streamDone && !fullContent) {
      throw new ApiError(502, 'OpenRouter stream completed with empty content.');
    }

    return { content: fullContent };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Maps HTTP error codes to normalized ApiErrors with clear messages. */
  private mapHttpError(status: number, body: unknown): ApiError {
    const detail = this.extractErrorMessage(body);

    switch (status) {
      case 401:
        return new ApiError(502, `OpenRouter: Invalid API key. ${detail}`);
      case 402:
        return new ApiError(502, `OpenRouter: Insufficient credits. ${detail}`);
      case 429:
        return new ApiError(429, `OpenRouter: Rate limit exceeded. Please try again later.`);
      case 503:
        return new ApiError(503, `OpenRouter: Provider temporarily unavailable. ${detail}`);
      default:
        return new ApiError(502, `OpenRouter error (HTTP ${status}): ${detail || 'Unknown error'}`);
    }
  }

  /** Safely extracts text content from the OpenAI-compatible response. */
  private extractContent(body: unknown): string | null {
    try {
      const typed = body as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return typed?.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  }

  /** Safely extracts an error message from OpenRouter's error body. */
  private extractErrorMessage(body: unknown): string {
    try {
      const typed = body as { error?: { message?: string } | string };
      if (typeof typed?.error === 'string') return typed.error;
      if (typeof typed?.error?.message === 'string') return typed.error.message;
      return '';
    } catch {
      return '';
    }
  }
}
