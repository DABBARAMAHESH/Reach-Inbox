import { CampaignRepository } from '../repositories/CampaignRepository';
import { EmailRepository } from '../repositories/EmailRepository';
import { SenderRepository } from '../repositories/SenderRepository';
import { emailQueue } from '../queues/emailQueue';
import { AppError, NotFoundError, ForbiddenError } from '../types';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';

export interface CreateCampaignInput {
  userId: string;
  senderId: string;
  subject: string;
  body?: string;
  startTime: Date;
  delayBetweenEmails: number;
  hourlyLimit: number;
  recipients: { email: string; name?: string }[];
  attachments?: { filename: string; content: string; contentType: string }[];
}

export class CampaignService {
  static async createCampaign(input: CreateCampaignInput) {
    const {
      userId,
      senderId,
      subject,
      body,
      startTime,
      delayBetweenEmails,
      hourlyLimit,
      recipients,
      attachments
    } = input;

    // 1. Verify Sender Ownership
    const sender = await SenderRepository.findById(senderId);
    if (!sender) {
      throw new NotFoundError('Specified sender not found');
    }
    if (sender.userId !== userId) {
      throw new ForbiddenError('You do not own this sender');
    }

    // 2. Normalize and Deduplicate Recipients
    const seen = new Set<string>();
    const normalizedRecipients: { email: string; name?: string }[] = [];

    for (const r of recipients) {
      const emailLower = r.email.trim().toLowerCase();
      if (!seen.has(emailLower)) {
        seen.add(emailLower);
        normalizedRecipients.push({ email: emailLower, name: r.name });
      }
    }

    if (normalizedRecipients.length === 0) {
      throw new AppError('No valid recipients provided');
    }

    // 3. Create Campaign record in PostgreSQL
    const baseStartTime = startTime.getTime() < Date.now() ? new Date() : startTime;
    const finalBody = body || '';

    const campaign = await CampaignRepository.create({
      userId,
      senderId,
      subject,
      body: finalBody,
      startTime: baseStartTime,
      delayBetweenEmails,
      hourlyLimit,
      totalRecipients: normalizedRecipients.length,
      status: 'scheduled',
      attachments
    });

    // 4. Create Email Records in DB first (Durable state)
    const emailDataToCreate = normalizedRecipients.map((r, index) => {
      const scheduledAt = new Date(baseStartTime.getTime() + index * delayBetweenEmails);
      const idempotencyKey = `email_${campaign.id}_${r.email}`;

      return {
        campaignId: campaign.id,
        userId,
        senderId,
        recipient: r.email,
        subject,
        body: finalBody,
        scheduledAt,
        idempotencyKey,
        status: 'scheduled'
      };
    });

    await EmailRepository.createMany(emailDataToCreate);

    // Fetch created email records to get generated IDs
    const createdEmails = await prisma.email.findMany({
      where: { campaignId: campaign.id }
    });

    // 5. Enqueue Deterministic BullMQ Delayed Jobs
    let enqueuedCount = 0;
    for (const email of createdEmails) {
      const delay = Math.max(0, email.scheduledAt.getTime() - Date.now());
      const deterministicJobId = `email-${email.id}`;

      try {
        const job = await emailQueue.add(
          'send-email',
          {
            emailId: email.id,
            campaignId: campaign.id,
            userId,
            senderId
          },
          {
            jobId: deterministicJobId,
            delay
          }
        );

        await EmailRepository.updateBullJobId(email.id, job.id!);
        enqueuedCount++;
      } catch (err) {
        logger.error({ err, emailId: email.id }, 'Failed to enqueue BullMQ job for email');
      }
    }

    logger.info(
      { campaignId: campaign.id, totalRecipients: normalizedRecipients.length, enqueuedCount },
      'Campaign created and BullMQ jobs enqueued'
    );

    return {
      campaign,
      totalRecipients: normalizedRecipients.length,
      enqueuedJobs: enqueuedCount,
      estimatedDurationMs: normalizedRecipients.length * delayBetweenEmails
    };
  }

  static async pauseCampaign(campaignId: string, userId: string) {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenError('Access denied');

    await CampaignRepository.updateStatus(campaignId, 'paused');
    return { success: true, message: 'Campaign paused successfully' };
  }

  static async resumeCampaign(campaignId: string, userId: string) {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenError('Access denied');

    await CampaignRepository.updateStatus(campaignId, 'running');
    return { success: true, message: 'Campaign resumed successfully' };
  }

  static async cancelCampaign(campaignId: string, userId: string) {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.userId !== userId) throw new ForbiddenError('Access denied');

    await CampaignRepository.updateStatus(campaignId, 'cancelled');
    const cancelledEmails = await EmailRepository.cancelByCampaignId(campaignId);

    return {
      success: true,
      message: `Campaign cancelled successfully. ${cancelledEmails} emails marked cancelled.`
    };
  }
}
