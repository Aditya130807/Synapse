import type { Request, Response, NextFunction } from 'express';
import * as workspaceMemoryService from './workspace-memory.service.js';
import type { CreateWorkspaceMemoryInput, UpdateWorkspaceMemoryInput } from './workspace-memory.types.js';

export async function getWorkspaceMemoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memories = await workspaceMemoryService.getWorkspaceMemories(userId);
    res.status(200).json({ memories });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspaceMemoryByIdHandler(
  req: Request<{ memoryId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memory = await workspaceMemoryService.getWorkspaceMemoryById(userId, req.params.memoryId);
    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function createWorkspaceMemoryHandler(
  req: Request<object, object, CreateWorkspaceMemoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memory = await workspaceMemoryService.createWorkspaceMemory(userId, req.body);
    res.status(201).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkspaceMemoryHandler(
  req: Request<{ memoryId: string }, object, UpdateWorkspaceMemoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const memory = await workspaceMemoryService.updateWorkspaceMemory(
      userId,
      req.params.memoryId,
      req.body,
    );
    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkspaceMemoryHandler(
  req: Request<{ memoryId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    await workspaceMemoryService.deleteWorkspaceMemory(userId, req.params.memoryId);
    res.status(200).json({ status: 'success', message: 'Workspace memory deleted successfully' });
  } catch (error) {
    next(error);
  }
}
