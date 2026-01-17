import { db } from '../config/database';
import { QueueService } from './queue.service';
import { EmailJob, EmailRecord, ScheduleEmailRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export class EmailService {
  /**
   * Schedule a single email
   */
  static async scheduleEmail(data: {
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    scheduledAt: Date;
    tenantId?: string;
  }): Promise<EmailRecord> {
    const emailId = uuidv4();

    // Create email record in database
    const emailRecord = {
      id: emailId,
      sender_email: data.senderEmail,
      recipient_email: data.recipientEmail,
      subject: data.subject,
      body: data.body,
      scheduled_at: data.scheduledAt,
      status: 'scheduled',
      tenant_id: data.tenantId || null,
    };

    await db('emails').insert(emailRecord);

    // Schedule in BullMQ
    const emailJob: EmailJob = {
      id: emailId,
      senderEmail: data.senderEmail,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      body: data.body,
      scheduledAt: data.scheduledAt,
      tenantId: data.tenantId,
    };

    const jobId = await QueueService.scheduleEmail(emailJob, data.scheduledAt);

    // Update job_id in database
    await db('emails').where({ id: emailId }).update({ job_id: jobId });

    return this.getEmailById(emailId);
  }

  /**
   * Schedule bulk emails from a list of recipients
   */
  static async scheduleBulkEmails(
    request: ScheduleEmailRequest
  ): Promise<{ batchId: string; totalScheduled: number }> {
    const {
      senderEmail,
      recipients,
      subject,
      body,
      scheduledAt,
      delayBetweenEmails = 2000,
      tenantId,
    } = request;

    const batchId = uuidv4();
    const startTime = new Date(scheduledAt);
    const emailJobs: EmailJob[] = [];
    const emailRecords: any[] = [];

    // Create batch job record
    await db('batch_jobs').insert({
      id: batchId,
      user_id: senderEmail,
      total_emails: recipients.length,
      status: 'processing',
    });

    // Prepare all email records
    for (let i = 0; i < recipients.length; i++) {
      const emailId = uuidv4();
      const emailScheduledAt = new Date(
        startTime.getTime() + i * delayBetweenEmails
      );

      emailRecords.push({
        id: emailId,
        sender_email: senderEmail,
        recipient_email: recipients[i],
        subject: subject,
        body: body,
        scheduled_at: emailScheduledAt,
        status: 'scheduled',
        tenant_id: tenantId || null,
      });

      emailJobs.push({
        id: emailId,
        senderEmail,
        recipientEmail: recipients[i],
        subject,
        body,
        scheduledAt: emailScheduledAt,
        tenantId,
      });
    }

    // Bulk insert email records
    await db('emails').insert(emailRecords);

    // Schedule all jobs in BullMQ
    const jobIds = await QueueService.scheduleBulkEmails(
      emailJobs,
      startTime,
      delayBetweenEmails
    );

    // Update job_ids in database
    for (let i = 0; i < emailJobs.length; i++) {
      await db('emails')
        .where({ id: emailJobs[i].id })
        .update({ job_id: jobIds[i] });
    }

    // Update batch job
    await db('batch_jobs').where({ id: batchId }).update({
      processed_emails: recipients.length,
      status: 'completed',
    });

    return {
      batchId,
      totalScheduled: recipients.length,
    };
  }

  /**
   * Get email by ID
   */
  static async getEmailById(id: string): Promise<EmailRecord> {
    const email = await db('emails').where({ id }).first();
    
    if (!email) {
      throw new Error('Email not found');
    }

    return this.mapToEmailRecord(email);
  }

  /**
   * Get all scheduled emails
   */
  static async getScheduledEmails(limit = 100, offset = 0): Promise<EmailRecord[]> {
    const emails = await db('emails')
      .whereIn('status', ['scheduled', 'queued'])
      .orderBy('scheduled_at', 'asc')
      .limit(limit)
      .offset(offset);

    return emails.map(this.mapToEmailRecord);
  }

  /**
   * Get all sent emails
   */
  static async getSentEmails(limit = 100, offset = 0): Promise<EmailRecord[]> {
    const emails = await db('emails')
      .whereIn('status', ['sent', 'failed'])
      .orderBy('sent_at', 'desc')
      .limit(limit)
      .offset(offset);

    return emails.map(this.mapToEmailRecord);
  }

  /**
   * Get emails by sender
   */
  static async getEmailsBySender(
    senderEmail: string,
    limit = 100,
    offset = 0
  ): Promise<EmailRecord[]> {
    const emails = await db('emails')
      .where({ sender_email: senderEmail })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return emails.map(this.mapToEmailRecord);
  }

  /**
   * Cancel a scheduled email
   */
  static async cancelEmail(id: string): Promise<boolean> {
    const email = await db('emails').where({ id }).first();
    
    if (!email) {
      throw new Error('Email not found');
    }

    if (email.status !== 'scheduled') {
      throw new Error('Only scheduled emails can be cancelled');
    }

    // Remove from queue
    if (email.job_id) {
      await QueueService.removeJob(email.job_id);
    }

    // Update status
    await db('emails').where({ id }).update({ status: 'failed', error_message: 'Cancelled by user' });

    return true;
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(): Promise<{
    total: number;
    scheduled: number;
    queued: number;
    sent: number;
    failed: number;
  }> {
    const stats = await db('emails')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const result = {
      total: 0,
      scheduled: 0,
      queued: 0,
      sent: 0,
      failed: 0,
    };

    stats.forEach((stat: any) => {
      result[stat.status as keyof typeof result] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    return result;
  }

  /**
   * Restore scheduled emails on server restart
   */
  static async restoreScheduledEmails(): Promise<number> {
    try {
      const now = new Date();
      
      // Get all scheduled/queued emails that should still be sent
      const emails = await db('emails')
        .whereIn('status', ['scheduled', 'queued'])
        .where('scheduled_at', '>', now)
        .select('*');

      console.log(`📧 Found ${emails.length} emails to restore`);

      let restored = 0;
      for (const email of emails) {
        try {
          const emailJob: EmailJob = {
            id: email.id,
            senderEmail: email.sender_email,
            recipientEmail: email.recipient_email,
            subject: email.subject,
            body: email.body,
            scheduledAt: new Date(email.scheduled_at),
            tenantId: email.tenant_id,
          };

          const jobId = await QueueService.scheduleEmail(
            emailJob,
            new Date(email.scheduled_at)
          );

          await db('emails').where({ id: email.id }).update({ job_id: jobId });
          restored++;
        } catch (error) {
          console.error(`Error restoring email ${email.id}:`, error);
        }
      }

      console.log(`✅ Restored ${restored} scheduled emails`);
      return restored;
    } catch (error) {
      console.error('Error restoring scheduled emails:', error);
      return 0;
    }
  }

  private static mapToEmailRecord(email: any): EmailRecord {
    return {
      id: email.id,
      senderEmail: email.sender_email,
      recipientEmail: email.recipient_email,
      subject: email.subject,
      body: email.body,
      scheduledAt: new Date(email.scheduled_at),
      status: email.status,
      sentAt: email.sent_at ? new Date(email.sent_at) : undefined,
      errorMessage: email.error_message,
      jobId: email.job_id,
      tenantId: email.tenant_id,
      createdAt: new Date(email.created_at),
      updatedAt: new Date(email.updated_at),
    };
  }
}