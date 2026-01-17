import axios from "axios";
import { ApiResponse, EmailRecord, ScheduleEmailRequest, EmailStats } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const emailApi = {
  // Schedule single email
  scheduleEmail: async (data: {
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    scheduledAt: string;
  }): Promise<EmailRecord> => {
    const response = await apiClient.post<ApiResponse<EmailRecord>>(
      "/emails/schedule",
      data
    );
    return response.data.data!;
  },

  // Schedule bulk emails
  scheduleBulkEmails: async (
    data: ScheduleEmailRequest
  ): Promise<{ batchId: string; totalScheduled: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ batchId: string; totalScheduled: number }>
    >("/emails/schedule-bulk", data);
    return response.data.data!;
  },

  // Get scheduled emails
  getScheduledEmails: async (
    limit = 100,
    offset = 0
  ): Promise<EmailRecord[]> => {
    const response = await apiClient.get<ApiResponse<EmailRecord[]>>(
      `/emails/scheduled?limit=${limit}&offset=${offset}`
    );
    return response.data.data!;
  },

  // Get sent emails
  getSentEmails: async (limit = 100, offset = 0): Promise<EmailRecord[]> => {
    const response = await apiClient.get<ApiResponse<EmailRecord[]>>(
      `/emails/sent?limit=${limit}&offset=${offset}`
    );
    return response.data.data!;
  },

  // Get email by ID
  getEmailById: async (id: string): Promise<EmailRecord> => {
    const response = await apiClient.get<ApiResponse<EmailRecord>>(
      `/emails/${id}`
    );
    return response.data.data!;
  },

  // Get emails by sender
  getEmailsBySender: async (
    email: string,
    limit = 100,
    offset = 0
  ): Promise<EmailRecord[]> => {
    const response = await apiClient.get<ApiResponse<EmailRecord[]>>(
      `/emails/sender/${email}?limit=${limit}&offset=${offset}`
    );
    return response.data.data!;
  },

  // Cancel email
  cancelEmail: async (id: string): Promise<void> => {
    await apiClient.delete(`/emails/${id}`);
  },

  // Get stats
  getStats: async (): Promise<EmailStats> => {
    const response = await apiClient.get<ApiResponse<EmailStats>>(
      "/emails/stats"
    );
    return response.data.data!;
  },
};