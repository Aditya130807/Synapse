import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { ConversationMemory, MemoryType as PrismaMemoryType } from '@prisma/client';
import type { CreateMemoryInput, UpdateMemoryInput, MemoryDTO, MemoryType } from './memory.types.js';

function formatMemory(memory: ConversationMemory): MemoryDTO {
  return {
    id: memory.id,
    conversationId: memory.conversationId,
    content: memory.content,
    type: memory.type as MemoryType,
    importance: memory.importance,
    isPinned: memory.isPinned,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}

/** Verify conversation belongs to user */
async function verifyConversationOwner(userId: string, conversationId: string): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!conv) {
    throw new ApiError(404, 'Conversation not found or access denied');
  }
}

/** Get all memories for a conversation (scoped to user) */
export async function getMemories(userId: string, conversationId: string): Promise<MemoryDTO[]> {
  await verifyConversationOwner(userId, conversationId);

  const memories = await prisma.conversationMemory.findMany({
    where: { conversationId },
    orderBy: [
      { isPinned: 'desc' },
      { importance: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return memories.map(formatMemory);
}

/** Create a new memory manually or from extraction */
export async function createMemory(
  userId: string,
  conversationId: string,
  input: CreateMemoryInput
): Promise<MemoryDTO> {
  await verifyConversationOwner(userId, conversationId);

  const cleanContent = input.content.trim();
  if (!cleanContent) {
    throw new ApiError(400, 'Memory content cannot be empty');
  }

  // Deduplication check: avoid exact/near duplicate content in same conversation
  const existing = await prisma.conversationMemory.findFirst({
    where: {
      conversationId,
      content: { equals: cleanContent, mode: 'insensitive' },
    },
  });

  if (existing) {
    // If it exists, update importance or pin state if provided
    const updated = await prisma.conversationMemory.update({
      where: { id: existing.id },
      data: {
        importance: input.importance ?? existing.importance,
        isPinned: input.isPinned ?? existing.isPinned,
        type: (input.type as PrismaMemoryType) ?? existing.type,
      },
    });
    return formatMemory(updated);
  }

  const memory = await prisma.conversationMemory.create({
    data: {
      conversationId,
      content: cleanContent,
      type: (input.type as PrismaMemoryType) || 'fact',
      importance: input.importance ?? 0.5,
      isPinned: input.isPinned ?? false,
    },
  });

  return formatMemory(memory);
}

/** Update an existing memory */
export async function updateMemory(
  userId: string,
  conversationId: string,
  memoryId: string,
  input: UpdateMemoryInput
): Promise<MemoryDTO> {
  await verifyConversationOwner(userId, conversationId);

  const existing = await prisma.conversationMemory.findFirst({
    where: { id: memoryId, conversationId },
  });

  if (!existing) {
    throw new ApiError(404, 'Memory not found');
  }

  const dataToUpdate: Record<string, any> = {};
  if (input.content !== undefined) {
    const trimmed = input.content.trim();
    if (!trimmed) throw new ApiError(400, 'Memory content cannot be empty');
    dataToUpdate.content = trimmed;
  }
  if (input.type !== undefined) dataToUpdate.type = input.type as PrismaMemoryType;
  if (input.importance !== undefined) dataToUpdate.importance = input.importance;
  if (input.isPinned !== undefined) dataToUpdate.isPinned = input.isPinned;

  const updated = await prisma.conversationMemory.update({
    where: { id: memoryId },
    data: dataToUpdate,
  });

  return formatMemory(updated);
}

/** Delete a memory */
export async function deleteMemory(
  userId: string,
  conversationId: string,
  memoryId: string
): Promise<void> {
  await verifyConversationOwner(userId, conversationId);

  const existing = await prisma.conversationMemory.findFirst({
    where: { id: memoryId, conversationId },
  });

  if (!existing) {
    throw new ApiError(404, 'Memory not found');
  }

  await prisma.conversationMemory.delete({
    where: { id: memoryId },
  });
}

/** Retrieve active memories for Context Engine injection */
export async function getRelevantMemoriesForContext(
  conversationId: string,
  limit = 10
): Promise<MemoryDTO[]> {
  const memories = await prisma.conversationMemory.findMany({
    where: { conversationId },
    orderBy: [
      { isPinned: 'desc' },
      { importance: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return memories.map(formatMemory);
}
