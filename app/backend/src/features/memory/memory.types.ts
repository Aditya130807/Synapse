export type MemoryType = 'summary' | 'preference' | 'fact' | 'decision' | 'goal';

export interface MemoryDTO {
  id: string;
  conversationId: string;
  content: string;
  type: MemoryType;
  importance: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  content: string;
  type?: MemoryType;
  importance?: number;
  isPinned?: boolean;
}

export interface UpdateMemoryInput {
  content?: string;
  type?: MemoryType;
  importance?: number;
  isPinned?: boolean;
}
