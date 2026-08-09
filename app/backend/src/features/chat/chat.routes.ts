import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { uploadMiddleware } from '../files/files.middleware.js';
import {
  uploadConversationFile,
  attachExistingFileHandler,
  detachConversationFileHandler,
  listConversationFilesHandler,
} from '../files/files.controller.js';
import {
  getConversationsHandler,
  createConversationHandler,
  renameConversationHandler,
  deleteConversationHandler,
  getMessagesHandler,
  createMessageHandler,
  createStreamMessageHandler,
  updateMessageHandler,
  deleteMessageHandler,
  regenerateStreamMessageHandler,
} from './chat.controller.js';
import {
  createConversationSchema,
  updateConversationSchema,
  createMessageSchema,
  getMessagesQuerySchema,
  validateBody,
  validateQuery,
} from './chat.validation.js';

import memoryRouter from '../memory/memory.routes.js';

const router = Router();

// Protect all chat routes
router.use(authenticate);

// Memory routes
router.use('/:id/memory', memoryRouter);

// Conversations CRUD
router.get('/', getConversationsHandler);
router.post('/', validateBody(createConversationSchema), createConversationHandler);
router.patch(
  '/:id',
  validateBody(updateConversationSchema),
  renameConversationHandler,
);
router.delete('/:id', deleteConversationHandler);

// Conversation Files Attachment
router.post(
  '/:id/files',
  uploadMiddleware.single('file'),
  uploadConversationFile,
);
router.post(
  '/:id/files/attach',
  attachExistingFileHandler,
);
router.get(
  '/:id/files',
  listConversationFilesHandler,
);
router.delete(
  '/:id/files/:fileId',
  detachConversationFileHandler,
);

// Messages CRUD
router.get(
  '/:id/messages',
  validateQuery(getMessagesQuerySchema),
  getMessagesHandler,
);
router.post(
  '/:id/messages',
  validateBody(createMessageSchema),
  createMessageHandler,
);
router.post(
  '/:id/messages/stream',
  validateBody(createMessageSchema),
  createStreamMessageHandler,
);
router.post(
  '/:id/messages/regenerate',
  regenerateStreamMessageHandler,
);
router.patch(
  '/:id/messages/:messageId',
  updateMessageHandler,
);
router.delete(
  '/:id/messages/:messageId',
  deleteMessageHandler,
);

export default router;

