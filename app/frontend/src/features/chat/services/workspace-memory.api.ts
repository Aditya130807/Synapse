import api from '@/lib/api';
import type { WorkspaceMemory, WorkspaceMemoryType } from '../chat.types';

export async function getWorkspaceMemoriesApi(): Promise<WorkspaceMemory[]> {
  const res = await api.get<{ memories: WorkspaceMemory[] }>('/memory');
  return res.data?.memories || [];
}

export async function createWorkspaceMemoryApi(
  content: string,
  type?: WorkspaceMemoryType,
  importance?: number,
): Promise<WorkspaceMemory> {
  const res = await api.post<{ memory: WorkspaceMemory }>('/memory', {
    content,
    type,
    importance,
  });
  return res.data!.memory;
}

export async function updateWorkspaceMemoryApi(
  memoryId: string,
  updates: Partial<Pick<WorkspaceMemory, 'content' | 'type' | 'importance'>>,
): Promise<WorkspaceMemory> {
  const res = await api.patch<{ memory: WorkspaceMemory }>(
    `/memory/${memoryId}`,
    updates,
  );
  return res.data!.memory;
}

export async function deleteWorkspaceMemoryApi(
  memoryId: string,
): Promise<void> {
  await api.delete(`/memory/${memoryId}`);
}
