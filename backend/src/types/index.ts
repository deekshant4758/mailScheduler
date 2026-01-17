export interface EmailJob {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  tenantId?: string;
}

export interface EmailRecord extends EmailJob {
  status: 'scheduled' | 'queued' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleEmailRequest {
  senderEmail: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
  tenantId?: string;
}

export interface RateLimitConfig {
  maxEmailsPerHour: number;
  maxEmailsPerHourPerSender: number;
  delayBetweenEmails: number;
}