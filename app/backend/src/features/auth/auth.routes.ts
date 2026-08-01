import { Router } from 'express';
import { validate } from './auth.validation.js';
import { signupSchema, loginSchema } from './auth.validation.js';
import { signupHandler, loginHandler, getMeHandler } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';

const router = Router();

router.post('/signup', validate(signupSchema), signupHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
