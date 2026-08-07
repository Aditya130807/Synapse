import prisma from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { createMessage } from '../chat/chat.service.js';
import { providerFactory } from './factory/providerFactory.js';
import type { ChatMessage, AIResponse } from './ai.types.js';
import type { MessageDTO } from '../chat/chat.types.js';

/**
 * generateAIResponse
 *
 * Orchestrates a synchronous AI turn.
 */
export async function generateAIResponse(
  userId: string,
  conversationId: string,
): Promise<MessageDTO> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const historyMessages: ChatMessage[] = history.map((m) => ({
    role: m.role as ChatMessage['role'],
    content: m.content,
  }));

  const messages: ChatMessage[] = [
    { role: 'system', content: env.SYSTEM_PROMPT },
    ...historyMessages,
  ];

  const provider = providerFactory();
  const aiResponse = await provider.generateResponse(messages);
  const assistantMessage = await createMessage(userId, conversationId, 'assistant', aiResponse.content);

  return assistantMessage;
}

/**
 * generateStreamAIResponse
 *
 * Orchestrates a streaming AI turn:
 *   1. Verify conversation ownership.
 *   2. Load recent message history (oldest-first).
 *   3. Prepend system prompt.
 *   4. Resolve active provider via providerFactory().
 *   5. Call provider.generateStreamResponse(), invoking onChunk for each token.
 *   6. Persist final assistant response to DB.
 *   7. Return saved assistant MessageDTO.
 */
export async function generateStreamAIResponse(
  userId: string,
  conversationId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<MessageDTO> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const historyMessages: ChatMessage[] = history.map((m) => ({
    role: m.role as ChatMessage['role'],
    content: m.content,
  }));

  const messages: ChatMessage[] = [
    { role: 'system', content: env.SYSTEM_PROMPT },
    ...historyMessages,
  ];

  const provider = providerFactory();

  let aiResponse: AIResponse = { content: '' };
  try {
    aiResponse = await provider.generateStreamResponse(messages, onChunk, signal);
  } catch (err) {
    // If request was aborted but some tokens were generated, save whatever was produced
    if (signal?.aborted && aiResponse.content.trim()) {
      return await createMessage(userId, conversationId, 'assistant', aiResponse.content);
    }
    throw err;
  }

  const assistantContent = aiResponse.content.trim() || 'No response generated.';
  const assistantMessage = await createMessage(userId, conversationId, 'assistant', assistantContent);

  return assistantMessage;
}
