import { UserRepository } from '../repositories/UserRepository';
import { SenderRepository } from '../repositories/SenderRepository';
import { CampaignService } from '../services/CampaignService';
import { MailService } from '../services/MailService';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { redisClient } from '../config/redis';

async function seed1000() {
  logger.info('Starting 1000+ Email Load Test Seed Script...');

  try {
    // 1. Create or fetch test user
    const user = await UserRepository.upsertGoogleUser({
      googleId: 'seed-loadtest-user-999',
      email: 'loadtest@reachinbox.test',
      name: 'Load Test User'
    });

    // 2. Create or fetch sender
    let sender = (await SenderRepository.findByUserId(user.id))[0];
    if (!sender) {
      const etherealAcc = await MailService.createEtherealAccount();
      sender = await SenderRepository.create({
        userId: user.id,
        displayName: 'Load Test Sender',
        email: etherealAcc.etherealUser,
        etherealUser: etherealAcc.etherealUser,
        etherealPassword: etherealAcc.etherealPassword,
        smtpHost: etherealAcc.smtpHost,
        smtpPort: etherealAcc.smtpPort
      });
    }

    // 3. Generate 1000 recipient records
    const count = 1000;
    const recipients = Array.from({ length: count }, (_, i) => ({
      email: `recipient_${i + 1}@stress-test.org`,
      name: `User ${i + 1}`
    }));

    logger.info(`Enqueuing campaign with ${count} recipients...`);

    // 4. Create Campaign & Enqueue BullMQ jobs
    const result = await CampaignService.createCampaign({
      userId: user.id,
      senderId: sender.id,
      subject: '1000 Email Stress & Load Test',
      body: 'Testing BullMQ worker concurrency, Redis rate limiting, and restart persistence.',
      startTime: new Date(),
      delayBetweenEmails: 100, // 100ms delay for faster load testing
      hourlyLimit: 200,
      recipients
    });

    logger.info(
      {
        campaignId: result.campaign.id,
        totalRecipients: result.totalRecipients,
        enqueuedJobs: result.enqueuedJobs
      },
      'SUCCESS: 1000 Email Load Test Campaign scheduled and BullMQ jobs created!'
    );

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to run 1000 email load seed script');
    process.exit(1);
  }
}

seed1000();
