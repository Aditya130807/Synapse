import api from '@/lib/api';
import type {
  ConversationMemory,
  MemoryType,
  PersistentMemory,
  PersistentMemoryScope,
  PersistentMemoryType,
  PersistentMemoryCategory,
} from '../chat.types';

export async function getPersistentMemoriesApi(params?: {
  scope?: PersistentMemoryScope;
  category?: PersistentMemoryCategory;
  search?: string;
  conversationId?: string;
}): Promise<PersistentMemory[]> {
  const res = await api.get<{ memories: PersistentMemory[] }>('/memory', { params });
  return res.data?.memories || [];
}

export async function getActiveMemoryContextApi(conversationId?: string, query?: string): Promise<PersistentMemory[]> {
  const res = await api.get<{ memories: PersistentMemory[] }>('/memory/active-context', {
    params: { conversationId, query },
  });
  return res.data?.memories || [];
}

export async function createPersistentMemoryApi(input: {
  content: string;
  type?: PersistentMemoryType;
  scope?: PersistentMemoryScope;
  category?: PersistentMemoryCategory;
  conversationId?: string;
}): Promise<PersistentMemory> {
  const res = await api.post<{ memory: PersistentMemory }>('/memory', input);
  return res.data!.memory;
}

export async function updatePersistentMemoryApi(
  memoryId: string,
  updates: Partial<Pick<PersistentMemory, 'content' | 'type' | 'scope' | 'category' | 'isPinned' | 'status'>>
): Promise<PersistentMemory> {
  const res = await api.patch<{ memory: PersistentMemory }>(`/memory/${memoryId}`, updates);
  return res.data!.memory;
}

export async function deletePersistentMemoryApi(memoryId: string): Promise<void> {
  await api.delete(`/memory/${memoryId}`);
}

// Backward-compatible helpers
export async function getMemoriesApi(conversationId: string): Promise<ConversationMemory[]> {
  const memories = await getPersistentMemoriesApi({ conversationId });
  return memories.map((m) => ({
    id: m.id,
    conversationId: m.conversationId || conversationId,
    content: m.content,
    type: m.type.toLowerCase() as MemoryType,
    importance: m.priority / 10,
    isPinned: m.isPinned,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

export async function createMemoryApi(
  conversationId: string,
  content: string,
  type?: MemoryType
): Promise<ConversationMemory> {
  const memory = await createPersistentMemoryApi({
    content,
    conversationId,
    scope: 'CONVERSATION',
    type: (type?.toUpperCase() as PersistentMemoryType) || 'FACT',
  });

  return {
    id: memory.id,
    conversationId: memory.conversationId || conversationId,
    content: memory.content,
    type: memory.type.toLowerCase() as MemoryType,
    importance: memory.priority / 10,
    isPinned: memory.isPinned,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

export async function updateMemoryApi(
  conversationId: string,
  memoryId: string,
  updates: Partial<Pick<ConversationMemory, 'content' | 'type' | 'isPinned'>>
): Promise<ConversationMemory> {
  const updated = await updatePersistentMemoryApi(memoryId, {
    content: updates.content,
    isPinned: updates.isPinned,
    type: updates.type ? (updates.type.toUpperCase() as PersistentMemoryType) : undefined,
  });

  return {
    id: updated.id,
    conversationId: updated.conversationId || conversationId,
    content: updated.content,
    type: updated.type.toLowerCase() as MemoryType,
    importance: updated.priority / 10,
    isPinned: updated.isPinned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function deleteMemoryApi(_conversationId: string, memoryId: string): Promise<void> {
  await deletePersistentMemoryApi(memoryId);
}
