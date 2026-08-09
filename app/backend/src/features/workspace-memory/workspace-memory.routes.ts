import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  getWorkspaceMemoriesHandler,
  getWorkspaceMemoryByIdHandler,
  createWorkspaceMemoryHandler,
  updateWorkspaceMemoryHandler,
  deleteWorkspaceMemoryHandler,
} from './workspace-memory.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getWorkspaceMemoriesHandler);
router.post('/', createWorkspaceMemoryHandler);
router.get('/:memoryId', getWorkspaceMemoryByIdHandler);
router.patch('/:memoryId', updateWorkspaceMemoryHandler);
router.delete('/:memoryId', deleteWorkspaceMemoryHandler);

export default router;
