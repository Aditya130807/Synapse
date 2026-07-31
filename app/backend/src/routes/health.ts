import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Synapse API',
    version: '0.1.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
