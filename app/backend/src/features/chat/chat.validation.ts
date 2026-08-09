import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must be 100 characters or less')
    .optional(),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must be 100 characters or less')
    .optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().trim().min(1, 'Message content is required'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  fileIds: z.array(z.string()).optional(),
  attachmentSources: z.record(z.string(), z.string()).optional(),
});


export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0 && val <= 100), {
      message: 'Limit must be a positive integer up to 100',
    }),
});

export const conversationIdParamSchema = z.object({
  id: z.string().min(1, 'Conversation ID is required'),
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Query validation failed',
        errors: result.error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    req.validatedQuery = result.data as Record<string, unknown>;
    next();
  };
}
