import api from '@/lib/api';
import type { ConversationMemory, MemoryType } from '../chat.types';

export async function getMemoriesApi(conversationId: string): Promise<ConversationMemory[]> {
  const res = await api.get<{ memories: ConversationMemory[] }>(
    `/chat/${conversationId}/memory`
  );
  return res.data?.memories || [];
}

export async function createMemoryApi(
  conversationId: string,
  content: string,
  type?: MemoryType,
  isPinned?: boolean
): Promise<ConversationMemory> {
  const res = await api.post<{ memory: ConversationMemory }>(
    `/chat/${conversationId}/memory`,
    { content, type, isPinned }
  );
  return res.data!.memory;
}

export async function updateMemoryApi(
  conversationId: string,
  memoryId: string,
  updates: Partial<Pick<ConversationMemory, 'content' | 'type' | 'importance' | 'isPinned'>>
): Promise<ConversationMemory> {
  const res = await api.patch<{ memory: ConversationMemory }>(
    `/chat/${conversationId}/memory/${memoryId}`,
    updates
  );
  return res.data!.memory;
}

export async function deleteMemoryApi(
  conversationId: string,
  memoryId: string
): Promise<void> {
  await api.delete(`/chat/${conversationId}/memory/${memoryId}`);
}
