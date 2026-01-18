"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await emailApi.getStats();
      
      console.log("📊 Raw stats response:", data); // Debug log
      
      if (data && data.database) {
        const scheduledCount = (data.database.scheduled || 0) + (data.database.queued || 0);
        const sentCount = data.database.sent || 0;
        const failedCount = data.database.failed || 0;
        
        console.log("✅ Parsed stats - Scheduled:", scheduledCount, "Sent:", sentCount, "Failed:", failedCount);
        
        setStats({
          scheduled: scheduledCount,
          sent: sentCount,
          failed: failedCount,
        });
      } else {
        console.error("❌ Invalid stats structure:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching email stats:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🚀 EmailStatsProvider mounted, fetching initial stats...");
    refreshStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing stats...");
      refreshStats();
    }, 10000);
    
    return () => {
      console.log("🛑 EmailStatsProvider unmounting, clearing interval");
      clearInterval(interval);
    };
  }, [refreshStats]);

  console.log("📈 Current stats:", stats); // Debug log

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