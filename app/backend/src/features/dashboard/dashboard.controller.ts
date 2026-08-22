import type { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from './dashboard.service.js';

export async function getDashboardStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getDashboardStats(req.user!.sub);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}
