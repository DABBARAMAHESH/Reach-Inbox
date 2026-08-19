import { prisma } from '../config/prisma';
import { Campaign } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../types';

export class CampaignRepository {
  static async create(data: {
    userId: string;
    senderId: string;
    subject: string;
    body: string;
    startTime: Date;
    delayBetweenEmails: number;
    hourlyLimit: number;
    totalRecipients: number;
    status?: string;
    attachments?: any;
  }): Promise<Campaign> {
    return prisma.campaign.create({
      data: {
        userId: data.userId,
        senderId: data.senderId,
        subject: data.subject,
        body: data.body,
        startTime: data.startTime,
        delayBetweenEmails: data.delayBetweenEmails,
        hourlyLimit: data.hourlyLimit,
        totalRecipients: data.totalRecipients,
        status: data.status || 'scheduled',
        attachments: data.attachments || undefined
      }
    });
  }

  static async findById(id: string): Promise<(Campaign & { sender: any; _count?: any }) | null> {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        sender: true,
        _count: {
          select: { emails: true }
        }
      }
    });
  }

  static async findByUserIdPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const { page, limit, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
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
          _count: {
            select: { emails: true }
          }
        }
      })
    ]);

    // Calculate sent, failed, pending per campaign
    const campaignsWithCounts = await Promise.all(
      items.map(async (c) => {
        const counts = await prisma.email.groupBy({
          by: ['status'],
          where: { campaignId: c.id },
          _count: { status: true }
        });
        const sent = counts.find((cnt) => cnt.status === 'sent')?._count.status || 0;
        const failed = counts.find((cnt) => cnt.status === 'failed')?._count.status || 0;
        const scheduled = counts.find((cnt) => cnt.status === 'scheduled')?._count.status || 0;
        const processing = counts.find((cnt) => cnt.status === 'processing')?._count.status || 0;
        const cancelled = counts.find((cnt) => cnt.status === 'cancelled')?._count.status || 0;

        return {
          ...c,
          sentCount: sent,
          failedCount: failed,
          scheduledCount: scheduled,
          processingCount: processing,
          cancelledCount: cancelled
        };
      })
    );

    return {
      success: true,
      data: campaignsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updateStatus(id: string, status: string): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }
}
