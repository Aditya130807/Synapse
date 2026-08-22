import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import type { SignupBody, LoginBody } from './auth.types.js';

export async function signupHandler(
  req: Request<object, object, SignupBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request<object, object, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.sub);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.updateProfile(req.user!.sub, req.body);
    res.status(200).json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updatePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.updatePassword(req.user!.sub, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
