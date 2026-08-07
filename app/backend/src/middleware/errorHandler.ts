import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'error',
        code: 'LIMIT_FILE_SIZE',
        message: 'File exceeds the maximum upload size of 20 MB.',
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      code: err.code,
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  if (err.message && (err.message.toLowerCase().includes('file type') || err.message.toLowerCase().includes('unsupported extension'))) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_FILE_TYPE',
      message: err.message,
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  console.error('[Error]', err);

  res.status(500).json({
    status: 'error',
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
}

