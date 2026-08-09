import { agentOrchestrator } from '../agents/index.js';
import type { MessageDTO } from '../chat/chat.types.js';

/**
 * generateAIResponse
 *
 * Delegated to AgentOrchestrator -> ContextEngine -> AgentRouter -> GeneralAgent.
 */
export async function generateAIResponse(
  userId: string,
  conversationId: string,
): Promise<MessageDTO> {
  return agentOrchestrator.execute(userId, conversationId);
}

/**
 * generateStreamAIResponse
 *
 * Delegated to AgentOrchestrator -> ContextEngine -> AgentRouter -> GeneralAgent.
 */
export async function generateStreamAIResponse(
  userId: string,
  conversationId: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<MessageDTO> {
  return agentOrchestrator.executeStream(userId, conversationId, onChunk, signal);
}
