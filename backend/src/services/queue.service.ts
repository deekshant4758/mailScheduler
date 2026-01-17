import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis';
import { EmailJob } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class QueueService {
  private static emailQueue: Queue;
  private static queueEvents: QueueEvents;

  static initialize() {
    // Create email queue
    this.emailQueue = new Queue('email-queue', {
      connection: redisConnection as any,
      defaultJobOptions: {
        attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
        backoff:     {
          type: 'exponential',
          delay: parseInt(process.env.RETRY_BACKOFF_MS || '60000'),
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Queue events for monitoring
    this.queueEvents = new QueueEvents('email-queue', {
      connection: redisConnection as any,
    });

    this.setupEventListeners();

    console.log('✅ Queue service initialized');
  }

  private static setupEventListeners() {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ Job ${jobId} completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed: ${failedReason}`);
    });
  }

  /**
   * Schedule an email to be sent at a specific time
   */
  static async scheduleEmail(
    emailData: EmailJob,
    scheduledAt: Date
  ): Promise<string> {
    const delay = scheduledAt.getTime() - Date.now();
    
    const job = await this.emailQueue.add(
      'send-email',
      emailData,
      {
        delay: delay > 0 ? delay : 0,
        jobId: emailData.id, // Use email ID as job ID for idempotency
      }
    );

    return job.id!;
  }

  /**
   * Schedule multiple emails with staggered delays
   */
  static async scheduleBulkEmails(
    emails: EmailJob[],
    startTime: Date,
    delayBetweenEmails: number
  ): Promise<string[]> {
    const jobIds: string[] = [];
    let currentDelay = startTime.getTime() - Date.now();

    for (const email of emails) {
      const job = await this.emailQueue.add(
        'send-email',
        email,
        {
          delay: currentDelay > 0 ? currentDelay : 0,
          jobId: email.id,
        }
      );

      jobIds.push(job.id!);
      currentDelay += delayBetweenEmails;
    }

    return jobIds;
  }

  /**
   * Get job by ID
   */
  static async getJob(jobId: string) {
    return await this.emailQueue.getJob(jobId);
  }

  /**
   * Remove a job (cancel scheduled email)
   */
  static async removeJob(jobId: string): Promise<boolean> {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  /**
   * Get queue stats
   */
  static async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }

  /**
   * Close queue connections gracefully
   */
  static async close() {
    await this.queueEvents.close();
    await this.emailQueue.close();
    console.log('✅ Queue service closed');
  }
}