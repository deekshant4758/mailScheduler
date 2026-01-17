"use client";

import { useEffect, useState } from "react";
import { emailApi } from "@/lib/api";
import { EmailRecord } from "@/types";
import { EmailList } from "@/components/email/EmailList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function SentPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSentEmails = async () => {
    try {
      setIsLoading(true);
      const data = await emailApi.getSentEmails();
      setEmails(data);
    } catch (error: any) {
      toast.error("Failed to load sent emails");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSentEmails();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSentEmails, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sent emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sent Emails</h1>
        <p className="text-gray-600">
          {emails.length} {emails.length === 1 ? "email" : "emails"} sent
        </p>
      </div>

      {emails.length === 0 ? (
        <EmptyState type="sent" />
      ) : (
        <EmailList emails={emails} type="sent" />
      )}
    </div>
  );
}