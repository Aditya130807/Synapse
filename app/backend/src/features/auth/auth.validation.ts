import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function validate(schema: z.ZodSchema) {
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
