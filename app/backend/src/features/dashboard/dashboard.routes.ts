import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { getDashboardStatsHandler } from './dashboard.controller.js';

const router = Router();

router.get('/stats', authenticate, getDashboardStatsHandler);

export default router;
