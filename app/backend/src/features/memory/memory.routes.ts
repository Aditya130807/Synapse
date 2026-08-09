import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  getMemoriesHandler,
  createMemoryHandler,
  updateMemoryHandler,
  deleteMemoryHandler,
} from './memory.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getMemoriesHandler);
router.post('/', createMemoryHandler);
router.patch('/:memoryId', updateMemoryHandler);
router.delete('/:memoryId', deleteMemoryHandler);

export default router;
