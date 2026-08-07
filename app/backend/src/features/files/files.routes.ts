import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { uploadMiddleware } from './files.middleware.js';
import {
  uploadFile,
  listFiles,
  getFile,
  previewFile,
  downloadFile,
  updateFile,
  removeFile,
  getAvailableKnowledgeFilesHandler,
} from './files.controller.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), uploadFile);
router.get('/available', getAvailableKnowledgeFilesHandler);
router.get('/', listFiles);
router.get('/:id', getFile);
router.get('/:id/preview', previewFile);
router.get('/:id/download', downloadFile);
router.patch('/:id', updateFile);
router.delete('/:id', removeFile);

export default router;

