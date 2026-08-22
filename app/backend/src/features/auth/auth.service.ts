import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { SignupBody, LoginBody, AuthResponse, SafeUser, JwtPayload } from './auth.types.js';

const SALT_ROUNDS = 10;

function generateToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies JwtPayload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

function toSafeUser(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signup(data: SignupBody): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  const token = generateToken(user.id);

  return { user: toSafeUser(user), token };
}

export async function login(data: LoginBody): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user.id);

  return { user: toSafeUser(user), token };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  return user;
}

export async function updateProfile(userId: string, data: { name?: string; email?: string }): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ApiError(409, 'Email address already in use');
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.email && { email: data.email.trim() }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function updatePassword(
  userId: string,
  data: { currentPassword?: string; newPassword?: string }
): Promise<{ message: string }> {
  if (!data.currentPassword || !data.newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  if (data.newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password updated successfully' };
}
