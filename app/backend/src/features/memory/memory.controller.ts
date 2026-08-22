import type { Request, Response, NextFunction } from 'express';
import * as persistentMemoryService from './persistent-memory.service.js';
import type { CreateMemoryInput, UpdateMemoryInput, MemoryScope, MemoryCategory, MemoryStatus } from './persistent-memory.types.js';

export async function getMemoriesHandler(
  req: Request<{ id?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id || (req.query.conversationId as string);

    const memories = await persistentMemoryService.getMemories(userId, {
      scope: req.query.scope as MemoryScope,
      category: req.query.category as MemoryCategory,
      status: req.query.status as MemoryStatus,
      search: req.query.search as string,
      workspaceId: (req.query.workspaceId as string) || 'default',
      conversationId,
    });

    res.status(200).json({ memories });
  } catch (error) {
    next(error);
  }
}

export async function getActiveContextHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.query.conversationId as string;
    const query = (req.query.query as string) || '';

    const memories = await persistentMemoryService.getRelevantMemoriesForContext(
      userId,
      (req.query.workspaceId as string) || 'default',
      conversationId || null,
      query,
      15
    );

    res.status(200).json({ memories, total: memories.length });
  } catch (error) {
    next(error);
  }
}

export async function createMemoryHandler(
  req: Request<{ id?: string }, object, CreateMemoryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id || req.body.conversationId;

    const memory = await persistentMemoryService.upsertInstructionOrMemory(userId, {
      ...req.body,
      conversationId,
    });

    res.status(201).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function updateMemoryHandler(
  req: Request<{ memoryId: string }, object, UpdateMemoryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memoryId = req.params.memoryId;

    const memory = await persistentMemoryService.updateMemory(userId, memoryId, req.body);
    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function deleteMemoryHandler(
  req: Request<{ memoryId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memoryId = req.params.memoryId;

    await persistentMemoryService.deleteMemory(userId, memoryId, false);
    res.status(200).json({ status: 'success', message: 'Memory deleted or archived successfully' });
  } catch (error) {
    next(error);
  }
}
