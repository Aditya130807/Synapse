export type WorkspaceMemoryType = 'fact' | 'preference' | 'decision' | 'goal';

export interface WorkspaceMemoryDTO {
  id: string;
  userId: string;
  content: string;
  type: WorkspaceMemoryType;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceMemoryInput {
  content: string;
  type?: WorkspaceMemoryType;
  importance?: number;
}

export interface UpdateWorkspaceMemoryInput {
  content?: string;
  type?: WorkspaceMemoryType;
  importance?: number;
}
