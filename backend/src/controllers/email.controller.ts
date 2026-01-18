import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { QueueService } from '../services/queue.service';
import { ScheduleEmailRequest } from '../types';

export class EmailController {
  /**
   * Schedule a single email
   * POST /api/v1/emails/schedule
   */
  static async scheduleEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { senderEmail, recipientEmail, subject, body, scheduledAt, tenantId } = req.body;

      // Validation
      if (!senderEmail || !recipientEmail || !subject || !body || !scheduledAt) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Scheduled time must be in the future',
        });
      }

      const email = await EmailService.scheduleEmail({
        senderEmail,
        recipientEmail,
        subject,
        body,
        scheduledAt: scheduledDate,
        tenantId,
      });

      res.status(201).json({
        success: true,
        data: email,
        message: 'Email scheduled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule bulk emails
   * POST /api/v1/emails/schedule-bulk
   */
  static async scheduleBulkEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const requestData: ScheduleEmailRequest = req.body;

      // Validation
      if (!requestData.senderEmail || !requestData.recipients || !requestData.subject || 
          !requestData.body || !requestData.scheduledAt) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      if (!Array.isArray(requestData.recipients) || requestData.recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipients must be a non-empty array',
        });
      }

      const scheduledDate = new Date(requestData.scheduledAt);
      if (scheduledDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Scheduled time must be in the future',
        });
      }

      const result = await EmailService.scheduleBulkEmails(requestData);

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.totalScheduled} emails scheduled successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scheduled emails
   * GET /api/v1/emails/scheduled
   */
  static async getScheduledEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const emails = await EmailService.getScheduledEmails(limit, offset);

      res.json({
        success: true,
        data: emails,
        count: emails.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sent emails
   * GET /api/v1/emails/sent
   */
  static async getSentEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const emails = await EmailService.getSentEmails(limit, offset);

      res.json({
        success: true,
        data: emails,
        count: emails.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get email by ID
   * GET /api/v1/emails/:id
   */
  static async getEmailById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const email = await EmailService.getEmailById(id as string);

      res.json({
        success: true,
        data: email,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get emails by sender
   * GET /api/v1/emails/sender/:email
   */
  static async getEmailsBySender(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const emails = await EmailService.getEmailsBySender(email as string, limit, offset);

      res.json({
        success: true,
        data: emails,
        count: emails.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a scheduled email
   * DELETE /api/v1/emails/:id
   */
  static async cancelEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await EmailService.cancelEmail(id as string);

      res.json({
        success: true,
        message: 'Email cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get email statistics
   * GET /api/v1/emails/stats
   */
  static async getEmailStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await EmailService.getEmailStats();
      const queueStats = await QueueService.getQueueStats();

      console.log("📊 Stats endpoint called - Database:", stats, "Queue:", queueStats);

      res.json({
        success: true,
        data: {
          database: stats,
          queue: queueStats,
        },
      });
    } catch (error) {
      console.error("❌ Error in stats endpoint:", error);
      next(error);
    }
  }
}