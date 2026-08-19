import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types';

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.JWT_SECRET) as AuthUser;
}
