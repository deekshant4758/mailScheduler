"use client";

import { useEffect, useState } from "react";
import { emailApi } from "@/lib/api";
import { EmailRecord } from "@/types";
import { EmailList } from "@/components/email/EmailList";
import { EmailGrid } from "@/components/email/EmailGrid";
// import {emailGrid}
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader, Grid, List } from "lucide-react";
import toast from "react-hot-toast";

type FilterStatus = "all" | "scheduled" | "queued";

export default function ScheduledPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const fetchScheduledEmails = async () => {
    try {
      setIsLoading(true);
      const data = await emailApi.getScheduledEmails();
      setEmails(data);
      applyFilter(data, filter);
    } catch (error: any) {
      toast.error("Failed to load scheduled emails");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (emailList: EmailRecord[], status: FilterStatus) => {
    if (status === "all") {
      setFilteredEmails(emailList);
    } else {
      setFilteredEmails(emailList.filter(email => email.status === status));
    }
  };

  useEffect(() => {
    fetchScheduledEmails();
    const interval = setInterval(fetchScheduledEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilter(emails, filter);
  }, [filter, emails]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduled emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scheduled Emails
          </h1>
          <p className="text-gray-600">
            {filteredEmails.length} {filteredEmails.length === 1 ? "email" : "emails"}{" "}
            {filter !== "all" && `(${filter})`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          {emails.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({emails.length})
              </button>
              <button
                onClick={() => setFilter("scheduled")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === "scheduled"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Scheduled ({emails.filter(e => e.status === "scheduled").length})
              </button>
              <button
                onClick={() => setFilter("queued")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === "queued"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Queued ({emails.filter(e => e.status === "queued").length})
              </button>
            </div>
          )}

          {/* View Toggle */}
          {filteredEmails.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredEmails.length === 0 ? (
        emails.length === 0 ? (
          <EmptyState type="scheduled" />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter} emails found</p>
            <button
              onClick={() => setFilter("all")}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Show all emails
            </button>
          </div>
        )
      ) : viewMode === "list" ? (
        <EmailList emails={filteredEmails} type="scheduled" />
      ) : (
        <EmailGrid emails={filteredEmails} />
      )}
    </div>
  );
}