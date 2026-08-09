import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { WorkspaceMemory, WorkspaceMemoryType as PrismaWSMemoryType } from '@prisma/client';
import type {
  CreateWorkspaceMemoryInput,
  UpdateWorkspaceMemoryInput,
  WorkspaceMemoryDTO,
  WorkspaceMemoryType,
} from './workspace-memory.types.js';

function formatWorkspaceMemory(memory: WorkspaceMemory): WorkspaceMemoryDTO {
  return {
    id: memory.id,
    userId: memory.userId,
    content: memory.content,
    type: memory.type as WorkspaceMemoryType,
    importance: memory.importance,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}

export async function getWorkspaceMemories(userId: string): Promise<WorkspaceMemoryDTO[]> {
  const memories = await prisma.workspaceMemory.findMany({
    where: { userId },
    orderBy: [
      { importance: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return memories.map(formatWorkspaceMemory);
}

export async function getWorkspaceMemoryById(
  userId: string,
  memoryId: string,
): Promise<WorkspaceMemoryDTO> {
  const memory = await prisma.workspaceMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!memory) {
    throw new ApiError(404, 'Workspace memory not found');
  }

  return formatWorkspaceMemory(memory);
}

export async function createWorkspaceMemory(
  userId: string,
  input: CreateWorkspaceMemoryInput,
): Promise<WorkspaceMemoryDTO> {
  const cleanContent = input.content.trim();
  if (!cleanContent) {
    throw new ApiError(400, 'Memory content cannot be empty');
  }

  if (cleanContent.length > 2000) {
    throw new ApiError(400, 'Memory content must be 2000 characters or less');
  }

  // Deduplication: case-insensitive match within same user
  const existing = await prisma.workspaceMemory.findFirst({
    where: {
      userId,
      content: { equals: cleanContent, mode: 'insensitive' },
    },
  });

  if (existing) {
    const updated = await prisma.workspaceMemory.update({
      where: { id: existing.id },
      data: {
        importance: input.importance ?? existing.importance,
        type: (input.type as PrismaWSMemoryType) ?? existing.type,
      },
    });
    return formatWorkspaceMemory(updated);
  }

  const memory = await prisma.workspaceMemory.create({
    data: {
      userId,
      content: cleanContent,
      type: (input.type as PrismaWSMemoryType) || 'fact',
      importance: input.importance ?? 0.5,
    },
  });

  return formatWorkspaceMemory(memory);
}

export async function updateWorkspaceMemory(
  userId: string,
  memoryId: string,
  input: UpdateWorkspaceMemoryInput,
): Promise<WorkspaceMemoryDTO> {
  const existing = await prisma.workspaceMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Workspace memory not found');
  }

  const dataToUpdate: Record<string, any> = {};
  if (input.content !== undefined) {
    const trimmed = input.content.trim();
    if (!trimmed) throw new ApiError(400, 'Memory content cannot be empty');
    if (trimmed.length > 2000) throw new ApiError(400, 'Memory content must be 2000 characters or less');
    dataToUpdate.content = trimmed;
  }
  if (input.type !== undefined) dataToUpdate.type = input.type as PrismaWSMemoryType;
  if (input.importance !== undefined) dataToUpdate.importance = input.importance;

  const updated = await prisma.workspaceMemory.update({
    where: { id: memoryId },
    data: dataToUpdate,
  });

  return formatWorkspaceMemory(updated);
}

export async function deleteWorkspaceMemory(
  userId: string,
  memoryId: string,
): Promise<void> {
  const existing = await prisma.workspaceMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Workspace memory not found');
  }

  await prisma.workspaceMemory.delete({
    where: { id: memoryId },
  });
}

/**
 * Find workspace memories relevant to a query using keyword-based scoring.
 * Returns only memories that have some relevance to the query.
 */
export async function findRelevantWorkspaceMemories(
  userId: string,
  query: string,
  limit = 5,
): Promise<WorkspaceMemoryDTO[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const allMemories = await prisma.workspaceMemory.findMany({
    where: { userId },
    orderBy: [
      { importance: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  if (allMemories.length === 0) return [];

  // Keyword-based relevance scoring
  const queryLower = query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .map((w) => w.replace(/[^a-z0-9]/g, ''));

  if (queryWords.length === 0) return [];

  const scored = allMemories
    .map((memory) => {
      const contentLower = memory.content.toLowerCase();
      const typeLower = memory.type.toLowerCase();
      let relevanceScore = 0;

      for (const word of queryWords) {
        if (contentLower.includes(word) || typeLower.includes(word)) {
          relevanceScore += 1.5;
        }

        // Common tech / domain synonym checks
        if ((word === 'database' || word === 'db') && (contentLower.includes('postgres') || contentLower.includes('sql') || contentLower.includes('mongo') || contentLower.includes('database') || contentLower.includes('db'))) {
          relevanceScore += 2.0;
        }
        if ((word === 'framework' || word === 'stack' || word === 'tech') && (contentLower.includes('react') || contentLower.includes('node') || contentLower.includes('express') || contentLower.includes('next'))) {
          relevanceScore += 2.0;
        }
      }

      // Boost by importance
      relevanceScore *= (0.5 + memory.importance);

      return { memory, relevanceScore };
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scored.map((item) => formatWorkspaceMemory(item.memory));
}
