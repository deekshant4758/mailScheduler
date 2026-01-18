import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { createEmailTransporter } from '../config/email';
import { db } from '../config/database';
import { EmailJob } from '../types';
import { RateLimiterService } from '../services/ratelimiter.service';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

dotenv.config();


export class EmailWorker {
  private static worker: Worker;
  private static transporter = createEmailTransporter();

  static initialize() {
    const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5');
    const emailDelayMs = parseInt(process.env.EMAIL_DELAY_MS || '2000');

    this.worker = new Worker<EmailJob>(
      'email-queue',
      async (job: Job<EmailJob>) => {
        return await this.processEmailJob(job);
      },
      {
        connection: redisConnection as any,
        concurrency,
        limiter: {
          max: 1,
          duration: emailDelayMs, // Minimum delay between emails
        },
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Email sent successfully: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Email failed: ${job?.id}`, err.message);
    });

    console.log(`✅ Email worker started with concurrency: ${concurrency}`);
  }

  private static async processEmailJob(job: Job<EmailJob>): Promise<void> {
    const { id, senderEmail, recipientEmail, subject, body, tenantId } = job.data;

    try {
      // Update status to queued
      await this.updateEmailStatus(id, 'queued');

      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
      }

      // Check rate limits
      const rateLimit = await this.checkRateLimits(senderEmail, tenantId);
      
      if (!rateLimit.allowed) {
        const nextSlot = rateLimit.nextAvailableSlot;
        const delayMs = nextSlot.getTime() - Date.now();
        
        console.log(`⏱️ Rate limit reached for ${senderEmail}. Rescheduling to ${nextSlot}`);
        
        await job.moveToDelayed(delayMs, job.token!);
        return;
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: senderEmail,
        to: recipientEmail,
        subject: subject,
        html: body,
      });

      console.log(`📧 Email sent: ${info.messageId}`);
      
      if (process.env.SMTP_HOST?.includes('ethereal')) {
        const previewUrl = `https://ethereal.email/message/${info.messageId}`;
        console.log(`🔗 Preview URL: ${previewUrl}`);
      }

      await this.updateEmailStatus(id, 'sent', new Date());
      await this.incrementRateLimitCounters(senderEmail, tenantId);

    } catch (error: any) {
      console.error(`Error sending email ${id}:`, error);
      await this.updateEmailStatus(id, 'failed', undefined, error.message);
      throw error;
    }
  }

  private static async checkRateLimits(
    senderEmail: string,
    tenantId?: string
  ): Promise<{ allowed: boolean; nextAvailableSlot: Date }> {
    const maxPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR || '200');
    const maxPerSender = parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50');

    // Check global rate limit
    const globalLimit = await RateLimiterService.checkAndIncrement(
      'global',
      maxPerHour
    );

    // Check per-sender rate limit
    const senderLimit = await RateLimiterService.checkAndIncrement(
      `sender:${senderEmail}`,
      maxPerSender
    );

    // Check tenant rate limit if applicable
    let tenantLimit = { allowed: true, resetAt: new Date() };
    if (tenantId) {
      tenantLimit = await RateLimiterService.checkAndIncrement(
        `tenant:${tenantId}`,
        maxPerSender
      );
    }

    const allowed = globalLimit.allowed && senderLimit.allowed && tenantLimit.allowed;
    
    // Find the earliest reset time if any limit is exceeded
    const nextAvailableSlot = allowed 
      ? new Date()
      : new Date(Math.max(
          globalLimit.resetAt.getTime(),
          senderLimit.resetAt.getTime(),
          tenantLimit.resetAt.getTime()
        ));

    return { allowed, nextAvailableSlot };
  }

  private static async incrementRateLimitCounters(
    senderEmail: string,
    tenantId?: string
  ): Promise<void> {
    // Counters are already incremented in checkRateLimits
    // This is a placeholder for any additional tracking
  }

  private static async updateEmailStatus(
    emailId: string,
    status: 'scheduled' | 'queued' | 'sent' | 'failed',
    sentAt?: Date,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (sentAt) {
        updateData.sent_at = sentAt;
      }
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      await db('emails')
        .where({ id: emailId })
        .update(updateData);
    } catch (error) {
      console.error('Error updating email status:', error);
    }
  }

  static async close() {
    await this.worker.close();
    console.log('✅ Email worker closed');
  }
}