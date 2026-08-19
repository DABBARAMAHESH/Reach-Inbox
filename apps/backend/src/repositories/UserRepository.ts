import { prisma } from '../config/prisma';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class UserRepository {
  static async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  static async upsertGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { googleId: data.googleId },
      update: { name: data.name, email: data.email, avatarUrl: data.avatarUrl },
      create: {
        googleId: data.googleId,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl
      }
    });
  }

  /** Register a new user with email + password */
  static async registerWithPassword(data: {
    name: string;
    email: string;
    password: string;
    verificationOtp: string;
  }): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        verificationOtp: data.verificationOtp,
        isVerified: false,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email)}`
      }
    });
  }

  /** Verify email+password login credentials */
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}
