export type MemoryScope = 'GLOBAL' | 'WORKSPACE' | 'CONVERSATION';

export type MemoryType =
  | 'INSTRUCTION'
  | 'PREFERENCE'
  | 'FACT'
  | 'CONSTRAINT'
  | 'PROJECT_CONTEXT'
  | 'SUMMARY';

export type MemoryStatus = 'ACTIVE' | 'ARCHIVED';

export type MemoryCategory =
  | 'workspace_instructions'
  | 'project_context'
  | 'user_preferences'
  | 'technical_preferences'
  | 'conversation_context';

export interface PersistentMemoryDTO {
  id: string;
  userId: string;
  workspaceId: string;
  conversationId?: string | null;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  category: MemoryCategory;
  priority: number;
  status: MemoryStatus;
  source: 'user_explicit' | 'auto_detected' | 'system';
  isPinned: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  content: string;
  type?: MemoryType;
  scope?: MemoryScope;
  category?: MemoryCategory;
  priority?: number;
  workspaceId?: string;
  conversationId?: string;
  source?: 'user_explicit' | 'auto_detected' | 'system';
  isPinned?: boolean;
}

export interface UpdateMemoryInput {
  content?: string;
  type?: MemoryType;
  scope?: MemoryScope;
  category?: MemoryCategory;
  priority?: number;
  status?: MemoryStatus;
  isPinned?: boolean;
}

export interface MemoryQueryResult {
  memories: PersistentMemoryDTO[];
  total: number;
}

export interface MemoryPipelineFeedback {
  actionExecuted?: 'saved' | 'forgotten' | 'viewed' | 'none';
  toastMessage?: string;
  detectedMemory?: PersistentMemoryDTO;
  forgottenContent?: string;
}
