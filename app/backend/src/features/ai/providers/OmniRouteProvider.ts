import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { AIProvider } from './AIProvider.js';
import type { ChatMessage, AIResponse } from '../ai.types.js';

/**
 * OmniRouteProvider — implements AIProvider using local OmniRoute endpoint (OpenAI-compatible).
 *
 * All requests route through OMNIROUTE_BASE_URL (default: http://localhost:20128/v1).
 * Credentials stay strictly on the backend.
 *
 * Reasoning model handling:
 *   - OmniRoute may resolve a model alias (e.g. auto/best-fast) to a reasoning model
 *     (e.g. big-pickle) that emits `reasoning_content` for an extended period before
 *     producing any `content` chunks.
 *   - `reasoning_content` is treated as a private thinking trace and is NEVER persisted
 *     as the assistant answer.
 *   - The presence of reasoning chunks is used only as a stream-liveness signal — it
 *     prevents the stream from appearing idle (which would trigger connection aborts).
 *   - `fullContent` (used for persistence) is built exclusively from `delta.content`.
 */
export class OmniRouteProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(modelOverride?: string) {
    this.baseUrl = env.OMNIROUTE_BASE_URL.replace(/\/+$/, '');
    this.apiKey = env.OMNIROUTE_API_KEY || 'sk-omniroute-local';
    this.model = modelOverride || env.GENERAL_AGENT_MODEL;
  }

  /**
   * Sends a synchronous Chat Completions request to OmniRoute and returns a normalized AIResponse.
   * Handles both JSON and text/event-stream (SSE) response formats returned by OmniRoute.
   *
   * For reasoning models: accumulates both `delta.content` and `delta.reasoning_content`
   * from SSE chunks so the non-streaming path never returns empty content.
   */
  async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
        }),
      });
    } catch (networkError: unknown) {
      const msg = networkError instanceof Error ? networkError.message : 'Network error';
      throw new ApiError(502, `OmniRoute provider unreachable: ${msg}`);
    }

    const headerResolvedModel = response.headers.get('x-omniroute-model');
    let resolvedModel = headerResolvedModel || this.model;

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(rawText);
      } catch {
        errorBody = { message: rawText };
      }
      throw this.mapHttpError(response.status, errorBody);
    }

    let textContent = '';
    let reasoningContent = '';

    if (contentType.includes('text/event-stream') || rawText.trim().startsWith('data:')) {
      // Parse SSE formatted response from OmniRoute (reasoning models always use SSE)
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed?.model && typeof parsed.model === 'string') {
              resolvedModel = parsed.model;
            }
            const chunk = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content;
            if (chunk) {
              textContent += chunk;
            }
            // Capture reasoning_content as a fallback for non-streaming path only
            const reasoning = parsed?.choices?.[0]?.delta?.reasoning_content;
            if (reasoning) {
              reasoningContent += reasoning;
            }
          } catch {
            // Ignore unparseable intermediate SSE lines
          }
        }
      }
    } else {
      // Standard JSON response
      try {
        const body = JSON.parse(rawText);
        if (body?.model && typeof body.model === 'string') {
          resolvedModel = body.model;
        }
        textContent = this.extractContent(body) || '';
      } catch {
        throw new ApiError(502, `OmniRoute returned a non-JSON response (HTTP ${response.status})`);
      }
    }

    // Prefer actual content; reasoning_content is a fallback for non-streaming path only
    // when the model emits reasoning but no content (unusual but possible).
    // IMPORTANT: reasoning_content is only used here (non-streaming) as a last resort.
    // In generateStreamResponse, reasoning_content is NEVER persisted.
    const finalContent = textContent.trim() || reasoningContent.trim();
    if (!finalContent) {
      throw new ApiError(502, 'OmniRoute returned an empty response.');
    }

    return { content: finalContent, resolvedModel };
  }

  /**
   * Sends a streaming Chat Completions request to OmniRoute (`stream: true`)
   * and invokes `onChunk` for each received **content** token.
   *
   * Reasoning model behaviour:
   *   - `delta.reasoning_content` chunks arrive before `delta.content`.
   *   - They are NOT passed to `onChunk` and are NOT included in `fullContent`.
   *   - Their presence is used as a stream-liveness signal to prevent keepalive
   *     timeouts from firing during the thinking phase.
   *   - Only `delta.content` chunks are streamed to the frontend and persisted.
   *
   * If the stream completes with zero content (non-abort), throws ApiError(502)
   * so the fallback executor can try the next model.
   */
  async generateStreamResponse(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<AIResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
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
      throw new ApiError(502, `OmniRoute provider unreachable: ${msg}`);
    }

    const headerResolvedModel = response.headers.get('x-omniroute-model');
    let resolvedModel = headerResolvedModel || this.model;

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ApiError(502, `OmniRoute returned a non-JSON response (HTTP ${response.status})`);
      }
      throw this.mapHttpError(response.status, body);
    }

    if (!response.body) {
      throw new ApiError(502, 'OmniRoute stream response body is unreadable.');
    }

    // fullContent accumulates ONLY delta.content — the model's actual answer.
    // reasoning_content is intentionally excluded from persistence.
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

              if (parsed?.model && typeof parsed.model === 'string') {
                resolvedModel = parsed.model;
              }

              // Only stream actual content tokens to the frontend
              const chunk = parsed?.choices?.[0]?.delta?.content;
              if (chunk) {
                fullContent += chunk;
                onChunk(chunk);
              }

              // reasoning_content is intentionally NOT forwarded via onChunk and
              // NOT accumulated into fullContent. It is the model's private thinking
              // trace and must not appear in the assistant's persisted answer.
              // Its presence here is simply evidence the stream is alive.

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
      throw new ApiError(502, `OmniRoute stream completed with empty content (model: ${resolvedModel}). Provider may have produced only reasoning tokens with no final answer.`);
    }

    return { content: fullContent, resolvedModel };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private mapHttpError(status: number, body: unknown): ApiError {
    const detail = this.extractErrorMessage(body);

    switch (status) {
      case 401:
        return new ApiError(502, `OmniRoute: Invalid API key or unauthorized. ${detail}`);
      case 402:
        return new ApiError(502, `OmniRoute: Insufficient credits or quota exhausted. ${detail}`);
      case 429:
        return new ApiError(429, `OmniRoute: Rate limit exceeded. ${detail}`);
      case 503:
      case 504:
        return new ApiError(503, `OmniRoute: Provider temporarily unavailable. ${detail}`);
      default:
        return new ApiError(status >= 400 && status < 500 ? status : 502, `OmniRoute error (HTTP ${status}): ${detail || 'Unknown error'}`);
    }
  }

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

  private extractErrorMessage(body: unknown): string {
    try {
      const typed = body as { error?: { message?: string } | string; message?: string };
      if (typeof typed?.error === 'string') return typed.error;
      if (typeof typed?.error?.message === 'string') return typed.error.message;
      if (typeof typed?.message === 'string') return typed.message;
      return '';
    } catch {
      return '';
    }
  }
}
