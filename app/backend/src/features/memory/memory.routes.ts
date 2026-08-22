import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  getMemoriesHandler,
  getActiveContextHandler,
  createMemoryHandler,
  updateMemoryHandler,
  deleteMemoryHandler,
} from './memory.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getMemoriesHandler);
router.get('/active-context', getActiveContextHandler);
router.post('/', createMemoryHandler);
router.patch('/:memoryId', updateMemoryHandler);
router.delete('/:memoryId', deleteMemoryHandler);

export default router;
