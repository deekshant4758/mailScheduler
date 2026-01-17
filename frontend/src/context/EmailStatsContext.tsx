"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { emailApi } from "@/lib/api";

interface EmailStats {
  scheduled: number;
  sent: number;
  failed: number;
}

interface EmailStatsContextType {
  stats: EmailStats;
  refreshStats: () => Promise<void>;
  isLoading: boolean;
}

const EmailStatsContext = createContext<EmailStatsContextType | undefined>(
  undefined
);

export function EmailStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<EmailStats>({
    scheduled: 0,
    sent: 0,
    failed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = async () => {
    try {
      setIsLoading(true);
      const data = await emailApi.getStats();
      setStats({
        scheduled: data.database.scheduled + data.database.queued,
        sent: data.database.sent,
        failed: data.database.failed,
      });
    } catch (error) {
      console.error("Error fetching email stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(refreshStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <EmailStatsContext.Provider value={{ stats, refreshStats, isLoading }}>
      {children}
    </EmailStatsContext.Provider>
  );
}

export function useEmailStats() {
  const context = useContext(EmailStatsContext);
  if (context === undefined) {
    throw new Error("useEmailStats must be used within an EmailStatsProvider");
  }
  return context;
}