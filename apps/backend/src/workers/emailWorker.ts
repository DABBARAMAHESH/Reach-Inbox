import { Worker, Job } from 'bullmq';
import { QUEUE_NAME, EmailJobData } from '../queues/emailQueue';
import { redisConfig } from '../config/redis';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { EmailRepository } from '../repositories/EmailRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { RateLimiterService } from '../services/RateLimiterService';
import { MailService } from '../services/MailService';

export function createEmailWorker() {
  const concurrency = env.WORKER_CONCURRENCY || 5;

  const worker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job: Job<EmailJobData>, token?: string) => {
      const { emailId } = job.data;
      const logContext = { jobId: job.id, emailId, attempt: job.attemptsMade + 1 };

      logger.info(logContext, 'Processing email job');

      // 1. Fetch Email record from PostgreSQL
      const email = await EmailRepository.findById(emailId);
      if (!email) {
        logger.warn(logContext, 'Email record not found in database, skipping job');
        return;
      }

      // 2. Application-Level Idempotency Check
      if (email.status === 'sent') {
        logger.info(logContext, 'Email already marked SENT in DB. Skipping to maintain idempotency.');
        return;
      }
      if (email.status === 'cancelled') {
        logger.info(logContext, 'Email marked CANCELLED in DB. Skipping.');
        return;
      }

      // 3. Campaign Status Check
      if (email.campaign) {
        if (email.campaign.status === 'cancelled') {
          logger.info(logContext, 'Associated campaign is CANCELLED. Marking email cancelled.');
          await EmailRepository.updateStatus(email.id, 'cancelled');
          return;
        }
        if (email.campaign.status === 'paused') {
          logger.info(logContext, 'Associated campaign is PAUSED. Rescheduling job in 30 seconds.');
          await job.moveToDelayed(Date.now() + 30000, token);
          return;
        }
      }

      // 4. Sender Rate Limit Check
      const hourlyLimit = email.campaign?.hourlyLimit || env.MAX_EMAILS_PER_HOUR;
      const rateCheck = await RateLimiterService.checkAndIncrementRateLimit(email.senderId, hourlyLimit);

      if (!rateCheck.allowed) {
        logger.info(
          { ...logContext, msUntilReset: rateCheck.msUntilReset },
          'Sender hourly rate limit reached. Rescheduling job to next window.'
        );
        await job.moveToDelayed(Date.now() + rateCheck.msUntilReset, token);
        return;
      }

      // 5. Minimum Delay Check
      const minDelay = email.campaign?.delayBetweenEmails ?? env.MIN_DELAY_BETWEEN_EMAILS_MS;
      const delayCheck = await RateLimiterService.enforceMinimumDelay(email.senderId, minDelay);

      if (delayCheck.delayed) {
        logger.info(
          { ...logContext, delayMs: delayCheck.delayMs },
          'Enforcing sender minimum delay. Rescheduling job.'
        );
        await job.moveToDelayed(Date.now() + delayCheck.delayMs, token);
        return;
      }

      // 6. Execute Email Delivery
      try {
        await EmailRepository.markProcessing(email.id);

        if (email.campaign && email.campaign.status === 'scheduled') {
          await CampaignRepository.updateStatus(email.campaignId, 'running');
        }

        const attachments = email.campaign?.attachments as any[] | undefined;

        const result = await MailService.sendEmail({
          sender: email.sender,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
          attachments
        });

        // 7. Update DB state to SENT
        await EmailRepository.markSent(email.id, result.etherealPreviewUrl);
        logger.info({ ...logContext, recipient: email.recipient }, 'Email successfully delivered and updated to SENT');
      } catch (error: any) {
        const attemptsMade = job.attemptsMade + 1;
        const maxAttempts = job.opts.attempts || 3;
        const errorMessage = error?.message || 'Unknown SMTP error';

        logger.error({ ...logContext, error: errorMessage, attemptsMade, maxAttempts }, 'Failed to deliver email');

        if (attemptsMade >= maxAttempts) {
          await EmailRepository.markFailed(email.id, errorMessage, attemptsMade);
          logger.error({ ...logContext, recipient: email.recipient }, 'Final attempt failed. Email marked FAILED.');
        } else {
          await EmailRepository.updateAttempt(email.id, attemptsMade, errorMessage);
        }

        throw error;
      }
    },
    {
      connection: redisConfig,
      concurrency
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Worker completed email job successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Worker job failure handler triggered');
  });

  return worker;
}
