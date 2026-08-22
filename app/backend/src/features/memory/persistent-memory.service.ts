import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  PersistentMemory,
  PersistentMemoryScope as PrismaMemoryScope,
  PersistentMemoryType as PrismaMemoryType,
  PersistentMemoryStatus as PrismaMemoryStatus,
} from '@prisma/client';
import type {
  CreateMemoryInput,
  UpdateMemoryInput,
  PersistentMemoryDTO,
  MemoryScope,
  MemoryType,
  MemoryStatus,
  MemoryCategory,
} from './persistent-memory.types.js';

export function containsSensitiveInfo(text: string): boolean {
  const sensitivePatterns = [
    /password\s*[:=]/i,
    /api[_\s]?key\s*[:=]/i,
    /secret[_\s]?key\s*[:=]/i,
    /bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/i,
    /ghp_[A-Za-z0-9]{36}/,
    /sk-[A-Za-z0-9]{32,}/,
    /aws[_\s]?secret/i,
    /private[_\s]?key/i,
  ];
  return sensitivePatterns.some((pattern) => pattern.test(text));
}

function resolveCategory(type: MemoryType, scope: MemoryScope): MemoryCategory {
  if (scope === 'CONVERSATION') return 'conversation_context';
  if (type === 'INSTRUCTION' || type === 'CONSTRAINT') return 'workspace_instructions';
  if (type === 'PREFERENCE') return 'user_preferences';
  if (type === 'PROJECT_CONTEXT') return 'project_context';
  return 'technical_preferences';
}

function resolveDefaultPriority(type: MemoryType): number {
  switch (type) {
    case 'INSTRUCTION':
      return 10;
    case 'CONSTRAINT':
      return 9;
    case 'PROJECT_CONTEXT':
      return 7;
    case 'PREFERENCE':
      return 6;
    case 'FACT':
      return 5;
    case 'SUMMARY':
      return 3;
    default:
      return 5;
  }
}

export function formatPersistentMemory(mem: PersistentMemory): PersistentMemoryDTO {
  return {
    id: mem.id,
    userId: mem.userId,
    workspaceId: mem.workspaceId,
    conversationId: mem.conversationId,
    content: mem.content,
    type: mem.type as MemoryType,
    scope: mem.scope as MemoryScope,
    category: mem.category as MemoryCategory,
    priority: mem.priority,
    status: mem.status as MemoryStatus,
    source: mem.source as 'user_explicit' | 'auto_detected' | 'system',
    isPinned: mem.isPinned,
    lastUsedAt: mem.lastUsedAt ? mem.lastUsedAt.toISOString() : null,
    createdAt: mem.createdAt.toISOString(),
    updatedAt: mem.updatedAt.toISOString(),
  };
}

/** Get all memories for a user with optional filtering */
export async function getMemories(
  userId: string,
  options?: {
    scope?: MemoryScope;
    workspaceId?: string;
    conversationId?: string;
    status?: MemoryStatus;
    category?: MemoryCategory;
    search?: string;
  }
): Promise<PersistentMemoryDTO[]> {
  const whereClause: any = { userId };

  if (options?.status) {
    whereClause.status = options.status as PrismaMemoryStatus;
  } else {
    whereClause.status = 'ACTIVE';
  }

  if (options?.scope) {
    whereClause.scope = options.scope as PrismaMemoryScope;
  }

  if (options?.workspaceId) {
    whereClause.workspaceId = options.workspaceId;
  }

  if (options?.conversationId) {
    whereClause.conversationId = options.conversationId;
  }

  if (options?.category) {
    whereClause.category = options.category;
  }

  if (options?.search && options.search.trim()) {
    whereClause.content = {
      contains: options.search.trim(),
      mode: 'insensitive',
    };
  }

  const memories = await prisma.persistentMemory.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: 'desc' },
      { priority: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  return memories.map(formatPersistentMemory);
}

/** Upsert memory with secret checks, deduplication, and conflict resolution */
export async function upsertInstructionOrMemory(
  userId: string,
  input: CreateMemoryInput
): Promise<PersistentMemoryDTO> {
  const cleanContent = input.content.trim();
  if (!cleanContent) {
    throw new ApiError(400, 'Memory content cannot be empty');
  }

  if (containsSensitiveInfo(cleanContent)) {
    throw new ApiError(
      400,
      'Security notice: Persistent memory cannot store passwords, tokens, or API credentials.'
    );
  }

  const scope: MemoryScope = input.scope || 'WORKSPACE';
  const type: MemoryType = input.type || (scope === 'WORKSPACE' ? 'INSTRUCTION' : 'FACT');
  const category: MemoryCategory = input.category || resolveCategory(type, scope);
  const priority: number = input.priority ?? resolveDefaultPriority(type);
  const workspaceId: string = input.workspaceId || 'default';
  const conversationId: string | undefined = input.conversationId;
  const source = input.source || 'user_explicit';

  // 1. Conflict Resolution Check: Archive previous conflicting rules in same scope & domain
  await resolveConflictingMemories(userId, workspaceId, scope, cleanContent);

  // 2. Exact/Near Deduplication Check
  const existing = await prisma.persistentMemory.findFirst({
    where: {
      userId,
      scope: scope as PrismaMemoryScope,
      workspaceId,
      status: 'ACTIVE',
      content: { equals: cleanContent, mode: 'insensitive' },
    },
  });

  if (existing) {
    const updated = await prisma.persistentMemory.update({
      where: { id: existing.id },
      data: {
        type: type as PrismaMemoryType,
        priority: Math.max(existing.priority, priority),
        category,
        source,
        isPinned: input.isPinned ?? existing.isPinned,
      },
    });
    return formatPersistentMemory(updated);
  }

  // 3. Create New Persistent Memory
  const created = await prisma.persistentMemory.create({
    data: {
      userId,
      workspaceId,
      conversationId: conversationId || null,
      content: cleanContent,
      type: type as PrismaMemoryType,
      scope: scope as PrismaMemoryScope,
      category,
      priority,
      status: 'ACTIVE',
      source,
      isPinned: input.isPinned ?? false,
    },
  });

  return formatPersistentMemory(created);
}

/** Detects and archives conflicting memories (e.g., PostgreSQL -> MySQL) */
async function resolveConflictingMemories(
  userId: string,
  workspaceId: string,
  scope: MemoryScope,
  newContent: string
): Promise<void> {
  const contentLower = newContent.toLowerCase();

  // Tech stack conflict pairs
  const conflictGroups = [
    ['postgresql', 'postgres', 'mysql', 'mongodb', 'sqlite', 'oracle', 'dynamodb'],
    ['prisma', 'typeorm', 'drizzle', 'sequelize', 'mongoose'],
    ['typescript', 'javascript'],
    ['react', 'vue', 'angular', 'svelte'],
    ['rest', 'graphql', 'grpc'],
  ];

  for (const group of conflictGroups) {
    const matchedTerm = group.find((term) => contentLower.includes(term));
    if (matchedTerm) {
      // Find conflicting active memories that mention a different term in the same group
      const otherTerms = group.filter((t) => t !== matchedTerm);

      const activeMemories = await prisma.persistentMemory.findMany({
        where: {
          userId,
          workspaceId,
          scope: scope as PrismaMemoryScope,
          status: 'ACTIVE',
        },
      });

      for (const mem of activeMemories) {
        const memContentLower = mem.content.toLowerCase();
        const containsConflictingTerm = otherTerms.some((term) => memContentLower.includes(term));

        if (containsConflictingTerm) {
          console.log(`[MemoryConflict] Archiving conflicting memory (${mem.id}): "${mem.content}" -> Replaced by "${newContent}"`);
          await prisma.persistentMemory.update({
            where: { id: mem.id },
            data: { status: 'ARCHIVED' },
          });
        }
      }
    }
  }
}

/** Update an existing memory */
export async function updateMemory(
  userId: string,
  memoryId: string,
  input: UpdateMemoryInput
): Promise<PersistentMemoryDTO> {
  const existing = await prisma.persistentMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Memory not found');
  }

  const dataToUpdate: any = {};
  if (input.content !== undefined) {
    const trimmed = input.content.trim();
    if (!trimmed) throw new ApiError(400, 'Memory content cannot be empty');
    if (containsSensitiveInfo(trimmed)) {
      throw new ApiError(400, 'Cannot save sensitive keys or passwords in memory.');
    }
    dataToUpdate.content = trimmed;
  }

  if (input.type !== undefined) dataToUpdate.type = input.type as PrismaMemoryType;
  if (input.scope !== undefined) dataToUpdate.scope = input.scope as PrismaMemoryScope;
  if (input.category !== undefined) dataToUpdate.category = input.category;
  if (input.priority !== undefined) dataToUpdate.priority = input.priority;
  if (input.status !== undefined) dataToUpdate.status = input.status as PrismaMemoryStatus;
  if (input.isPinned !== undefined) dataToUpdate.isPinned = input.isPinned;

  const updated = await prisma.persistentMemory.update({
    where: { id: memoryId },
    data: dataToUpdate,
  });

  return formatPersistentMemory(updated);
}

/** Archive or Delete a memory */
export async function deleteMemory(
  userId: string,
  memoryId: string,
  hardDelete = false
): Promise<void> {
  const existing = await prisma.persistentMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Memory not found');
  }

  if (hardDelete) {
    await prisma.persistentMemory.delete({ where: { id: memoryId } });
  } else {
    await prisma.persistentMemory.update({
      where: { id: memoryId },
      data: { status: 'ARCHIVED' },
    });
  }
}

/** Retrieve active relevant memories for Context Engine prompt injection */
export async function getRelevantMemoriesForContext(
  userId: string,
  workspaceId = 'default',
  conversationId: string | null,
  userQuery: string,
  limit = 10
): Promise<PersistentMemoryDTO[]> {
  // Fetch active memories accessible in this context: GLOBAL, WORKSPACE, or current CONVERSATION
  const activeMemories = await prisma.persistentMemory.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [
        { scope: 'GLOBAL' },
        { scope: 'WORKSPACE', workspaceId },
        ...(conversationId ? [{ scope: 'CONVERSATION' as PrismaMemoryScope, conversationId }] : []),
      ],
    },
    orderBy: [
      { isPinned: 'desc' },
      { priority: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  if (activeMemories.length === 0) return [];

  // Relevance ranking: Instructions and Pinned memories are always included first
  const queryLower = userQuery.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .map((w) => w.replace(/[^a-z0-9]/g, ''));

  const scored = activeMemories.map((mem) => {
    let score = mem.priority * 2; // Base score by priority (Instructions priority=10 -> score 20)

    if (mem.isPinned) score += 50;

    const contentLower = mem.content.toLowerCase();
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 3;
      }
    }

    return { mem, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, limit).map((s) => formatPersistentMemory(s.mem));

  return selected;
}

/** Mark memory IDs as used in assistant response */
export async function markMemoriesUsed(memoryIds: string[]): Promise<void> {
  if (memoryIds.length === 0) return;
  try {
    await prisma.persistentMemory.updateMany({
      where: { id: { in: memoryIds } },
      data: { lastUsedAt: new Date() },
    });
  } catch (err) {
    console.error('[MemoryService] Failed to update lastUsedAt for memories:', err);
  }
}
