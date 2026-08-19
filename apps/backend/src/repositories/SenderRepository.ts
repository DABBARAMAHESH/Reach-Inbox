import { prisma } from '../config/prisma';
import { Sender } from '@prisma/client';
import { encryptText, decryptText } from '../lib/crypto';

export class SenderRepository {
  static async findById(id: string): Promise<Sender | null> {
    return prisma.sender.findUnique({
      where: { id }
    });
  }

  static async findByUserId(userId: string): Promise<Sender[]> {
    return prisma.sender.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async create(data: {
    userId: string;
    displayName: string;
    email: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    etherealUser?: string;
    etherealPassword?: string;
  }): Promise<Sender> {
    const encryptedPass = data.smtpPassword ? encryptText(data.smtpPassword) : null;
    return prisma.sender.create({
      data: {
        userId: data.userId,
        displayName: data.displayName,
        email: data.email,
        smtpHost: data.smtpHost || 'smtp.ethereal.email',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || data.etherealUser || data.email,
        smtpPassEncrypted: encryptedPass,
        etherealUser: data.etherealUser || null,
        etherealPassword: data.etherealPassword || null
      }
    });
  }

  static async update(
    id: string,
    data: {
      displayName?: string;
      email?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
    }
  ): Promise<Sender> {
    const updateData: any = { ...data };
    if (data.smtpPassword) {
      updateData.smtpPassEncrypted = encryptText(data.smtpPassword);
      delete updateData.smtpPassword;
    }
    return prisma.sender.update({
      where: { id },
      data: updateData
    });
  }

  static async delete(id: string): Promise<Sender> {
    return prisma.sender.delete({
      where: { id }
    });
  }

  static async upsertGoogleOAuthSender(data: {
    userId: string;
    email: string;
    displayName: string;
    oauth2AccessToken: string;
    oauth2RefreshToken?: string;
  }): Promise<Sender> {
    const existing = await prisma.sender.findFirst({
      where: {
        userId: data.userId,
        email: data.email
      }
    });

    if (existing) {
      return prisma.sender.update({
        where: { id: existing.id },
        data: {
          displayName: data.displayName,
          oauth2AccessToken: data.oauth2AccessToken,
          ...(data.oauth2RefreshToken ? { oauth2RefreshToken: data.oauth2RefreshToken } : {}),
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: data.email
        }
      });
    }

    return prisma.sender.create({
      data: {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: data.email,
        oauth2AccessToken: data.oauth2AccessToken,
        oauth2RefreshToken: data.oauth2RefreshToken || null
      }
    });
  }

  static getDecryptedPassword(sender: Sender): string {
    if (sender.etherealPassword) {
      return sender.etherealPassword;
    }
    if (sender.smtpPassEncrypted) {
      return decryptText(sender.smtpPassEncrypted);
    }
    return '';
  }
}
