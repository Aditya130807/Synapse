import type { Request, Response } from 'express';
import { semanticSearchService } from './semanticSearch.service.js';

export async function searchSemanticHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const { query, limit = 10 } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ status: 'error', message: 'Search query parameter is required' });
      return;
    }

    const results = await semanticSearchService.searchKnowledgeBase(userId, query, Number(limit) || 10);

    res.json({
      status: 'success',
      data: {
        query,
        totalResults: results.length,
        results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Semantic search failed',
    });
  }
}

export async function searchConversationHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const { conversationId, query, limit = 10 } = req.body;
    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({ status: 'error', message: 'conversationId is required' });
      return;
    }

    if (!query || typeof query !== 'string') {
      res.status(400).json({ status: 'error', message: 'Search query parameter is required' });
      return;
    }

    const results = await semanticSearchService.searchConversationFiles(
      conversationId,
      userId,
      query,
      Number(limit) || 10
    );

    res.json({
      status: 'success',
      data: {
        query,
        totalResults: results.length,
        results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Conversation search failed',
    });
  }
}
