import { prisma } from '../config/prisma';
import { Email } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../types';

export class EmailRepository {
  static async createMany(
    emails: {
      campaignId: string;
      userId: string;
      senderId: string;
      recipient: string;
      subject: string;
      body: string;
      scheduledAt: Date;
      idempotencyKey: string;
      status?: string;
    }[]
  ) {
    return prisma.email.createMany({
      data: emails,
      skipDuplicates: true
    });
  }

  static async findById(id: string): Promise<(Email & { campaign?: any; sender?: any }) | null> {
    return prisma.email.findUnique({
      where: { id },
      include: {
        campaign: true,
        sender: true
      }
    });
  }

  static async findByIdempotencyKey(idempotencyKey: string): Promise<Email | null> {
    return prisma.email.findUnique({
      where: { idempotencyKey }
    });
  }

  static async updateBullJobId(id: string, bullJobId: string): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: { bullJobId }
    });
  }

  static async findByUserIdPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Email>> {
    const { page, limit, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
          campaign: {
            select: {
              id: true,
              subject: true
            }
          }
        }
      })
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async markProcessing(id: string): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: { status: 'processing' }
    });
  }

  static async markSent(id: string, etherealPreviewUrl?: string): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        etherealPreviewUrl: etherealPreviewUrl || null
      }
    });
  }

  static async markFailed(id: string, lastError: string, attempts: number): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: {
        status: 'failed',
        lastError,
        attempts
      }
    });
  }

  static async updateAttempt(id: string, attempts: number, lastError?: string): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: {
        attempts,
        lastError: lastError || null
      }
    });
  }

  static async updateStatus(id: string, status: string): Promise<Email> {
    return prisma.email.update({
      where: { id },
      data: { status }
    });
  }

  static async cancelByCampaignId(campaignId: string): Promise<number> {
    const res = await prisma.email.updateMany({
      where: {
        campaignId,
        status: { in: ['scheduled', 'processing'] }
      },
      data: { status: 'cancelled' }
    });
    return res.count;
  }
}
