import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { searchSemanticHandler, searchConversationHandler } from './search.controller.js';

const router = Router();

router.use(authenticate);

router.post('/semantic', searchSemanticHandler);
router.post('/conversation', searchConversationHandler);

export default router;
