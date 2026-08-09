import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { storageProvider } from '../lib/storage/local.storage.js';
import { vectorProvider } from '../lib/vector/vector.factory.js';
import { providerFactory } from '../features/ai/factory/providerFactory.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const timestamp = new Date().toISOString();
  let dbStatus = 'connected';
  let storageStatus = 'available';
  let vectorStatus = 'available';
  let aiStatus = 'available';

  // 1. Check Database connection via simple Prisma query
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  // 2. Check Storage availability
  try {
    const exists = await storageProvider.exists('.').catch(() => true);
    if (!exists) {
      storageStatus = 'unavailable';
    }
  } catch {
    storageStatus = 'unavailable';
  }

  // 3. Check Vector Provider initialization
  try {
    if (!vectorProvider || !vectorProvider.name) {
      vectorStatus = 'unavailable';
    }
  } catch {
    vectorStatus = 'unavailable';
  }

  // 4. Check AI Provider initialization
  try {
    const aiProvider = providerFactory();
    if (!aiProvider) {
      aiStatus = 'unavailable';
    }
  } catch {
    aiStatus = 'unavailable';
  }


  const isHealthy = dbStatus === 'connected' && storageStatus === 'available';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp,
    services: {
      database: dbStatus,
      storage: storageStatus,
      vector: vectorStatus,
      ai: aiStatus,
    },
  });
});

export default router;
