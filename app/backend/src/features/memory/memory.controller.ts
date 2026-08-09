import type { Request, Response, NextFunction } from 'express';
import * as memoryService from './memory.service.js';
import type { CreateMemoryInput, UpdateMemoryInput } from './memory.types.js';

export async function getMemoriesHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id;
    const memories = await memoryService.getMemories(userId, conversationId);
    res.status(200).json({ memories });
  } catch (error) {
    next(error);
  }
}

export async function createMemoryHandler(
  req: Request<{ id: string }, object, CreateMemoryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id;
    const memory = await memoryService.createMemory(userId, conversationId, req.body);
    res.status(201).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function updateMemoryHandler(
  req: Request<{ id: string; memoryId: string }, object, UpdateMemoryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id: conversationId, memoryId } = req.params;
    const memory = await memoryService.updateMemory(userId, conversationId, memoryId, req.body);
    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function deleteMemoryHandler(
  req: Request<{ id: string; memoryId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id: conversationId, memoryId } = req.params;
    await memoryService.deleteMemory(userId, conversationId, memoryId);
    res.status(200).json({ status: 'success', message: 'Memory deleted successfully' });
  } catch (error) {
    next(error);
  }
}
