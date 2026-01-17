import { redisConnection } from '../config/redis';
import { db } from '../config/database';
import dayjs from 'dayjs';

export class RateLimiterService {
  private static readonly RATE_LIMIT_PREFIX = 'rate_limit:';

  /**
   * Check and increment rate limit for a given key
   * Returns true if within limit, false if exceeded
   */
  static async checkAndIncrement(
    key: string,
    maxCount: number
  ): Promise<{ allowed: boolean; current: number; resetAt: Date }> {
    const hourWindow = dayjs().startOf('hour').toDate();
    const redisKey = `${this.RATE_LIMIT_PREFIX}${key}:${hourWindow.getTime()}`;

    try {
      // Use Redis for fast atomic operations
      const multi = redisConnection.multi();
      multi.incr(redisKey);
      multi.expire(redisKey, 3700); // 1 hour + 100s buffer
      
      const results = await multi.exec();
      const currentCount = results?.[0]?.[1] as number || 0;

      // Also update DB for persistence (async, non-blocking)
      this.updateDatabaseCounter(key, hourWindow).catch(err => 
        console.error('Error updating DB counter:', err)
      );

      const resetAt = dayjs(hourWindow).add(1, 'hour').toDate();

      return {
        allowed: currentCount <= maxCount,
        current: currentCount,
        resetAt,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        current: 0,
        resetAt: dayjs().add(1, 'hour').toDate(),
      };
    }
  }

  /**
   * Update database counter for persistence across restarts
   */
  private static async updateDatabaseCounter(
    key: string,
    windowStart: Date
  ): Promise<void> {
    try {
      await db.raw(`
        INSERT INTO rate_limits (key_name, window_start, count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE count = count + 1
      `, [key, windowStart]);
    } catch (error) {
      console.error('DB counter update error:', error);
    }
  }

  /**
   * Get current count for a key
   */
  static async getCurrentCount(key: string): Promise<number> {
    const hourWindow = dayjs().startOf('hour').toDate();
    const redisKey = `${this.RATE_LIMIT_PREFIX}${key}:${hourWindow.getTime()}`;

    try {
      const count = await redisConnection.get(redisKey);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting current count:', error);
      return 0;
    }
  }

  /**
   * Restore rate limit counters from DB on server restart
   */
  static async restoreFromDatabase(): Promise<void> {
    try {
      const currentHour = dayjs().startOf('hour').toDate();
      
      const records = await db('rate_limits')
        .where('window_start', '>=', currentHour)
        .select('key_name', 'window_start', 'count');

      for (const record of records) {
        const redisKey = `${this.RATE_LIMIT_PREFIX}${record.key_name}:${new Date(record.window_start).getTime()}`;
        await redisConnection.set(redisKey, record.count, 'EX', 3700);
      }

      console.log(`✅ Restored ${records.length} rate limit counters from database`);
    } catch (error) {
      console.error('Error restoring rate limits from DB:', error);
    }
  }
}