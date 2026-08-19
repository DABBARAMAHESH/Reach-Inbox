import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

export class RateLimiterService {
  /**
   * Generates a Redis key for hourly rate limit tracking.
   * Key format: email-rate:{senderId}:{hourWindow}
   */
  private static getHourlyKey(senderId: string, timestamp: number = Date.now()): string {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const hourWindow = `${year}${month}${day}-${hour}`;
    return `email-rate:${senderId}:${hourWindow}`;
  }

  /**
   * Calculates milliseconds remaining until the start of the next UTC hour.
   */
  public static getMsUntilNextHour(timestamp: number = Date.now()): number {
    const nextHour = new Date(timestamp);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
    return Math.max(1000, nextHour.getTime() - timestamp);
  }

  /**
   * Checks if sender has reached their hourly limit.
   * Uses Redis atomic INCR with 1-hour expiration.
   */
  public static async checkAndIncrementRateLimit(
    senderId: string,
    hourlyLimit: number
  ): Promise<{ allowed: boolean; currentCount: number; msUntilReset: number }> {
    const key = this.getHourlyKey(senderId);
    const msUntilReset = this.getMsUntilNextHour();

    // Atomic increment
    const count = await redisClient.incr(key);

    if (count === 1) {
      // Set key TTL to expire shortly after the hour window finishes (e.g. 3700s)
      await redisClient.expire(key, 3700);
    }

    if (count > hourlyLimit) {
      logger.warn(
        { senderId, count, hourlyLimit, msUntilReset },
        'Hourly email limit reached for sender. Rescheduling job.'
      );
      return {
        allowed: false,
        currentCount: count,
        msUntilReset
      };
    }

    return {
      allowed: true,
      currentCount: count,
      msUntilReset
    };
  }

  /**
   * Coordinates minimum delay between emails for a specific sender across multiple workers.
   * Key: email-delay:{senderId}
   */
  public static async enforceMinimumDelay(
    senderId: string,
    minDelayMs: number
  ): Promise<{ delayed: boolean; delayMs: number }> {
    if (minDelayMs <= 0) return { delayed: false, delayMs: 0 };

    const key = `email-delay:${senderId}`;
    const now = Date.now();
    const lastSentStr = await redisClient.get(key);

    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      const elapsed = now - lastSent;
      if (elapsed < minDelayMs) {
        const remainingDelay = minDelayMs - elapsed;
        return { delayed: true, delayMs: remainingDelay };
      }
    }

    // Set last sent timestamp with 1-hour TTL
    await redisClient.set(key, now.toString(), 'EX', 3600);
    return { delayed: false, delayMs: 0 };
  }
}
